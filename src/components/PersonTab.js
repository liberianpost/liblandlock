import React, { useState, useEffect } from 'react';
import './PersonTab.css';

function PersonTab() {
  const [formData, setFormData] = useState({
    DSSN: '',
    First_Name: '',
    Last_Name: '',
    Date_of_Birth: '',
    Place_of_Birth: '',
    Address: '',
    Phone_Number: '',
    Image_URL: 'https://storage.googleapis.com/liblandlock/',
    License_ID: '',
    Role: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [existingDSSNs, setExistingDSSNs] = useState([]);
  const [existingLicenseIDs, setExistingLicenseIDs] = useState([]);

  const API_BASE = 'https://libpayapp.liberianpost.com:8081';

  useEffect(() => {
    fetchExistingPersons();
  }, []);

  const fetchExistingPersons = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/persons`);
      if (response.ok) {
        const persons = await response.json();
        setExistingDSSNs(persons.map(p => p.DSSN));
        setExistingLicenseIDs(persons.map(p => p.License_ID).filter(id => id));
      }
    } catch (error) {
      console.error('Error fetching existing persons:', error);
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
      setImageFile(file);
      
      // Show image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewImg = document.getElementById('image-preview');
        if (previewImg) {
          previewImg.src = e.target.result;
          document.getElementById('image-preview-container').style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_BASE}/api/upload-gcp-image`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedImageUrl(result.imageUrl);
        return result.imageUrl;
      } else {
        throw new Error(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setStatus({ 
        message: 'Failed to upload image. Please try again.', 
        type: 'error' 
      });
      return null;
    }
  };

  const copyImageUrl = () => {
    navigator.clipboard.writeText(uploadedImageUrl || formData.Image_URL)
      .then(() => {
        setStatus({ 
          message: 'Image URL copied to clipboard!', 
          type: 'success' 
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  const validateForm = () => {
    if (!formData.DSSN.trim()) {
      setStatus({ message: 'DSSN is required', type: 'error' });
      return false;
    }

    if (existingDSSNs.includes(formData.DSSN)) {
      setStatus({ message: 'This DSSN already exists', type: 'error' });
      return false;
    }

    if (!formData.First_Name.trim()) {
      setStatus({ message: 'First Name is required', type: 'error' });
      return false;
    }

    if (!formData.Last_Name.trim()) {
      setStatus({ message: 'Last Name is required', type: 'error' });
      return false;
    }

    if (!formData.Role) {
      setStatus({ message: 'Role is required', type: 'error' });
      return false;
    }

    // Validate License ID for Surveyors
    if ((formData.Role === 'Surveyor' || formData.Role === 'Both') && !formData.License_ID.trim()) {
      setStatus({ message: 'License ID is required for Surveyors', type: 'error' });
      return false;
    }

    if (formData.License_ID && existingLicenseIDs.includes(formData.License_ID)) {
      setStatus({ message: 'This License ID already exists', type: 'error' });
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
      let finalImageUrl = formData.Image_URL;
      
      // Upload image if file was selected
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      // Prepare data for submission
      const submissionData = {
        ...formData,
        Image_URL: finalImageUrl
      };

      const response = await fetch(`${API_BASE}/api/person`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ 
          message: 'Person registered successfully!', 
          type: 'success' 
        });
        
        // Reset form
        setFormData({
          DSSN: '',
          First_Name: '',
          Last_Name: '',
          Date_of_Birth: '',
          Place_of_Birth: '',
          Address: '',
          Phone_Number: '',
          Image_URL: 'https://storage.googleapis.com/liblandlock/',
          License_ID: '',
          Role: ''
        });
        setImageFile(null);
        setUploadedImageUrl('');
        document.getElementById('image-upload').value = '';
        document.getElementById('image-preview-container').style.display = 'none';
        
        // Refresh existing data
        fetchExistingPersons();
      } else {
        setStatus({ 
          message: result.message || 'Error registering person', 
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

  return (
    <div className="person-tab">
      <div className="instructions">
        <h4><i className="fas fa-info-circle"></i> Instructions for Person Registration</h4>
        <ol>
          <li>Fill in all <strong>required fields</strong> marked with *</li>
          <li><strong>DSSN</strong> must be unique - check if it already exists</li>
          <li><strong>License ID</strong> is required only for Surveyors</li>
          <li>Upload a clear photo of the person</li>
          <li>After uploading, the image URL will be generated automatically</li>
          <li>Click "Register Person" when all information is complete</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="person-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="DSSN" className="required-field">DSSN (Digital Social Security Number)</label>
            <input
              type="text"
              id="DSSN"
              name="DSSN"
              value={formData.DSSN}
              onChange={handleInputChange}
              placeholder="Enter DSSN (e.g., DSSN123456789)"
              required
            />
            <div className="field-note">Must be unique - will be checked automatically</div>
          </div>

          <div className="form-group">
            <label htmlFor="First_Name" className="required-field">First Name</label>
            <input
              type="text"
              id="First_Name"
              name="First_Name"
              value={formData.First_Name}
              onChange={handleInputChange}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="Last_Name" className="required-field">Last Name</label>
            <input
              type="text"
              id="Last_Name"
              name="Last_Name"
              value={formData.Last_Name}
              onChange={handleInputChange}
              placeholder="Enter last name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="Date_of_Birth">Date of Birth</label>
            <input
              type="date"
              id="Date_of_Birth"
              name="Date_of_Birth"
              value={formData.Date_of_Birth}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Place_of_Birth">Place of Birth</label>
            <input
              type="text"
              id="Place_of_Birth"
              name="Place_of_Birth"
              value={formData.Place_of_Birth}
              onChange={handleInputChange}
              placeholder="Enter place of birth"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Address">Address</label>
            <textarea
              id="Address"
              name="Address"
              value={formData.Address}
              onChange={handleInputChange}
              placeholder="Enter complete address"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Phone_Number">Phone Number</label>
            <input
              type="tel"
              id="Phone_Number"
              name="Phone_Number"
              value={formData.Phone_Number}
              onChange={handleInputChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Role" className="required-field">Role</label>
            <select
              id="Role"
              name="Role"
              value={formData.Role}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Role</option>
              <option value="Landowner">Landowner</option>
              <option value="Surveyor">Surveyor</option>
              <option value="Both">Both (Landowner and Surveyor)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="License_ID">License ID (for Surveyors)</label>
            <input
              type="text"
              id="License_ID"
              name="License_ID"
              value={formData.License_ID}
              onChange={handleInputChange}
              placeholder="Enter license ID if Surveyor"
              disabled={formData.Role !== 'Surveyor' && formData.Role !== 'Both'}
            />
            <div className="field-note">
              Required only for Surveyor role
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image-upload">Person Photo</label>
            <div className="file-upload">
              <div className="file-upload-btn">
                <span>{imageFile ? imageFile.name : 'Choose Photo'}</span>
                <i className="fas fa-upload"></i>
                <input
                  type="file"
                  id="image-upload"
                  className="file-upload-input"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div id="image-preview-container" className="image-preview-container">
              <img id="image-preview" src="" alt="Preview" className="image-preview" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Image_URL">Image URL</label>
            <div className="url-input-group">
              <input
                type="text"
                id="Image_URL"
                name="Image_URL"
                value={uploadedImageUrl || formData.Image_URL}
                onChange={handleInputChange}
                placeholder="Image URL will appear here after upload"
                readOnly={!!uploadedImageUrl}
              />
              <button 
                type="button" 
                className="copy-url-btn"
                onClick={copyImageUrl}
                disabled={!uploadedImageUrl && !formData.Image_URL}
              >
                <i className="fas fa-copy"></i> Copy
              </button>
            </div>
            <div className="field-note">
              {uploadedImageUrl 
                ? 'URL generated from uploaded image' 
                : 'Upload an image or enter URL manually'
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
                Processing...
              </>
            ) : (
              'Register Person'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PersonTab;
