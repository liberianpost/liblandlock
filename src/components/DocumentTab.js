import React, { useState, useEffect } from 'react';
import './DocumentTab.css';

function DocumentTab() {
  const [formData, setFormData] = useState({
    Image_URL: 'https://storage.googleapis.com/liblandlock/',
    Owner_DSSN: '',
    Document_Type: ''
  });
  
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [existingOwners, setExistingOwners] = useState([]);

  const API_BASE = 'https://api.liblandlock.com';
  const GCP_BASE_URL = 'https://storage.googleapis.com/liblandlock/';

  useEffect(() => {
    fetchExistingOwners();
  }, []);

  const fetchExistingOwners = async () => {
    try {
      const personsResponse = await fetch(`${API_BASE}/api/persons`);
      if (personsResponse.ok) {
        const persons = await personsResponse.json();
        const landowners = persons.filter(p => p.Role === 'Landowner' || p.Role === 'Both');
        setExistingOwners(landowners.map(o => o.DSSN));
      }
    } catch (error) {
      console.error('Error fetching existing owners:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      
      // Show preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewImg = document.getElementById('document-preview');
          if (previewImg) {
            previewImg.src = e.target.result;
            document.getElementById('document-preview-container').style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadDocument = async () => {
    if (!documentFile) return null;

    const formData = new FormData();
    formData.append('image', documentFile);

    try {
      const response = await fetch(`${API_BASE}/api/upload-gcp-image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedDocumentUrl(result.imageUrl);
        return result.imageUrl;
      } else {
        throw new Error(result.message || 'Document upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setStatus({ 
        message: 'Failed to upload document. Please try again.', 
        type: 'error' 
      });
      return null;
    }
  };

  const copyDocumentUrl = () => {
    navigator.clipboard.writeText(uploadedDocumentUrl || formData.Image_URL)
      .then(() => {
        setStatus({ 
          message: 'Document URL copied to clipboard!', 
          type: 'success' 
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const validateForm = () => {
    if (!formData.Owner_DSSN.trim()) {
      setStatus({ message: 'Owner DSSN is required', type: 'error' });
      return false;
    }

    if (!existingOwners.includes(formData.Owner_DSSN)) {
      setStatus({ message: 'Owner DSSN must belong to a registered landowner', type: 'error' });
      return false;
    }

    if (!formData.Document_Type) {
      setStatus({ message: 'Document Type is required', type: 'error' });
      return false;
    }

    // Check if we have either uploaded file or manual URL
    if (!documentFile && !formData.Image_URL.trim()) {
      setStatus({ message: 'Please upload a document or provide a document URL', type: 'error' });
      return false;
    }

    if (formData.Image_URL.trim() && !formData.Image_URL.startsWith('http')) {
      setStatus({ message: 'Document URL must be a valid web address', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setStatus({ message: '', type: '' });

    try {
      let finalDocumentUrl = formData.Image_URL;
      
      // Upload document if file was selected
      if (documentFile) {
        const uploadedUrl = await uploadDocument();
        if (uploadedUrl) {
          finalDocumentUrl = uploadedUrl;
        }
      } else {
        // If only URL is provided, ensure it's a complete URL
        if (finalDocumentUrl && !finalDocumentUrl.startsWith('http')) {
          finalDocumentUrl = GCP_BASE_URL + finalDocumentUrl;
        }
      }

      // Prepare data for submission
      const submissionData = {
        ...formData,
        Image_URL: finalDocumentUrl
      };

      const response = await fetch(`${API_BASE}/api/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ 
          message: 'Document uploaded successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setFormData({
          Image_URL: 'https://storage.googleapis.com/liblandlock/',
          Owner_DSSN: '',
          Document_Type: ''
        });
        setDocumentFile(null);
        setUploadedDocumentUrl('');
        document.getElementById('document-upload').value = '';
        document.getElementById('document-preview-container').style.display = 'none';
      } else {
        setStatus({ 
          message: result.message || 'Error uploading document', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ 
        message: 'Network error. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch(type) {
      case 'Probate_Court': return 'Probate Court';
      case 'LLA': return 'Liberia Land Authority (LLA)';
      case 'LRA': return 'Liberia Revenue Authority (LRA)';
      default: return type;
    }
  };

  return (
    <div className="document-tab">
      <div className="instructions">
        <h4><i className="fas fa-info-circle"></i> Instructions for Document Upload</h4>
        <ol>
          <li>Select the <strong>Owner DSSN</strong> from the dropdown or enter manually</li>
          <li>Choose the <strong>Document Type</strong> from the options</li>
          <li>Either <strong>upload a document file</strong> or <strong>provide a document URL</strong></li>
          <li>Supported file types: Images (JPG, PNG, etc.) and PDF documents</li>
          <li>After uploading, the document URL will be generated automatically</li>
          <li>Click "Upload Document" when all information is complete</li>
        </ol>
        
        <div className="document-types-info">
          <h5>Document Types:</h5>
          <ul>
            <li><strong>Probate Court:</strong> Legal documents from probate court</li>
            <li><strong>LLA:</strong> Documents from Liberia Land Authority</li>
            <li><strong>LRA:</strong> Documents from Liberia Revenue Authority</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="document-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="Owner_DSSN" className="required-field">Owner DSSN</label>
            <input
              type="text"
              id="Owner_DSSN"
              name="Owner_DSSN"
              value={formData.Owner_DSSN}
              onChange={handleInputChange}
              placeholder="Enter owner DSSN"
              list="owner-dssn-list"
              required
            />
            <datalist id="owner-dssn-list">
              {existingOwners.map(dssn => (
                <option key={dssn} value={dssn} />
              ))}
            </datalist>
            <div className="field-note">
              Must be a registered landowner's DSSN
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Document_Type" className="required-field">Document Type</label>
            <select
              id="Document_Type"
              name="Document_Type"
              value={formData.Document_Type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Document Type</option>
              <option value="Probate_Court">Probate Court</option>
              <option value="LLA">Liberia Land Authority (LLA)</option>
              <option value="LRA">Liberia Revenue Authority (LRA)</option>
            </select>
            {formData.Document_Type && (
              <div className="document-type-info">
                <strong>Type:</strong> {getDocumentTypeLabel(formData.Document_Type)}
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label htmlFor="document-upload">Document File</label>
            <div className="file-upload">
              <div className="file-upload-btn">
                <span>{documentFile ? documentFile.name : 'Choose Document File'}</span>
                <i className="fas fa-upload"></i>
                <input
                  type="file"
                  id="document-upload"
                  className="file-upload-input"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>
              <div className="file-note">
                Supported formats: Images, PDF, Word documents
              </div>
            </div>

            <div id="document-preview-container" className="document-preview-container">
              <img id="document-preview" src="" alt="Document preview" className="document-preview" />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="Image_URL">Document URL</label>
            <div className="url-input-group">
              <input
                type="text"
                id="Image_URL"
                name="Image_URL"
                value={uploadedDocumentUrl || formData.Image_URL}
                onChange={handleInputChange}
                placeholder="Document URL will appear here after upload"
                readOnly={!!uploadedDocumentUrl}
              />
              <button 
                type="button" 
                className="copy-url-btn"
                onClick={copyDocumentUrl}
                disabled={!uploadedDocumentUrl && !formData.Image_URL}
              >
                <i className="fas fa-copy"></i> Copy
              </button>
            </div>
            <div className="field-note">
              {uploadedDocumentUrl 
                ? 'URL generated from uploaded document' 
                : 'Upload a document or enter URL manually'
              }
            </div>
          </div>
        </div>

        {status.message && (
          <div className={`status-message status-${status.type}`}>
            {status.message}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DocumentTab;
