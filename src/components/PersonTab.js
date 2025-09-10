import React, { useState, useEffect, useCallback } from 'react';
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
  const [touchedFields, setTouchedFields] = useState({});

  const API_BASE = 'https://api.liblandlock.com';

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchExistingPersons = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/persons`);
      if (response.ok) {
        const persons = await response.json();
        setExistingDSSNs(persons.map(p => p.DSSN));
        setExistingLicenseIDs(persons.map(p => p.License_ID).filter(id => id));
      } else {
        console.error('Failed to fetch existing persons:', response.status);
      }
    } catch (error) {
      console.error('Error fetching existing persons:', error);
      setStatus({ 
        message: 'Failed to load existing data. Please refresh the page.', 
        type: 'error' 
      });
    }
  }, []);

  useEffect(() => {
    fetchExistingPersons();
  }, [fetchExistingPersons]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setStatus({ 
        message: 'Please select an image file (JPEG, PNG, etc.)', 
        type: 'error' 
      });
      e.target.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ 
        message: 'Image size must be less than 5MB', 
        type: 'error' 
      });
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setStatus({ message: '', type: '' });
    
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
    
    // Display the file URL in plain text
    const fileUrlDisplay = document.getElementById('file-url-display');
    if (fileUrlDisplay) {
      fileUrlDisplay.textContent = file.name;
      fileUrlDisplay.style.display = 'block';
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('image', imageFile);

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/upload-gcp-image`, {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedImageUrl(result.imageUrl);
        // Update the form data with the uploaded image URL
        setFormData(prev => ({
          ...prev,
          Image_URL: result.imageUrl
        }));
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
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.DSSN.trim()) {
      errors.push('DSSN is required');
    } else if (existingDSSNs.includes(formData.DSSN)) {
      errors.push('This DSSN already exists');
    }

    if (!formData.First_Name.trim()) {
      errors.push('First Name is required');
    }

    if (!formData.Last_Name.trim()) {
      errors.push('Last Name is required');
    }

    if (!formData.Role) {
      errors.push('Role is required');
    }

    // Validate License ID only for Surveyors
    if (formData.Role === 'Surveyor' || formData.Role === 'Both') {
      if (!formData.License_ID.trim()) {
        errors.push('License ID is required for Surveyors');
      } else if (existingLicenseIDs.includes(formData.License_ID)) {
        errors.push('This License ID already exists');
      }
    }

    // Validate Image URL format if manually entered
    if (formData.Image_URL && !formData.Image_URL.startsWith('https://')) {
      errors.push('Image URL must start with https://');
    }

    if (errors.length > 0) {
      setStatus({ 
        message: errors.join('. ') + '.', 
        type: 'error' 
      });
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
        if (!uploadedUrl) {
          // Upload failed, stop submission
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      // Prepare data for submission
      const submissionData = {
        DSSN: formData.DSSN.trim(),
        First_Name: formData.First_Name.trim(),
        Last_Name: formData.Last_Name.trim(),
        Date_of_Birth: formData.Date_of_Birth || null,
        Place_of_Birth: formData.Place_of_Birth.trim() || null,
        Address: formData.Address.trim() || null,
        Phone_Number: formData.Phone_Number.trim() || null,
        Image_URL: finalImageUrl,
        Role: formData.Role,
        // Explicitly set License_ID to null for Landowners
        License_ID: (formData.Role === 'Surveyor' || formData.Role === 'Both') ? 
          formData.License_ID.trim() : null
      };

      const response = await fetch(`${API_BASE}/api/person`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
      }

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
        setTouchedFields({});
        
        // Clear file input and preview
        const fileInput = document.getElementById('image-upload');
        if (fileInput) fileInput.value = '';
        
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.style.display = 'none';
        
        const fileUrlDisplay = document.getElementById('file-url-display');
        if (fileUrlDisplay) fileUrlDisplay.style.display = 'none';
        
        // Refresh existing data
        fetchExistingPersons();
      } else {
        throw new Error(result.message || 'Error registering person');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ 
        message: error.message || 'Network error. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Field validation helpers
  const isFieldValid = (fieldName) => {
    if (!touchedFields[fieldName]) return true;
    
    switch(fieldName) {
      case 'DSSN':
        return formData.DSSN.trim() && !existingDSSNs.includes(formData.DSSN);
      case 'First_Name':
        return formData.First_Name.trim();
      case 'Last_Name':
        return formData.Last_Name.trim();
      case 'License_ID':
        if (formData.Role === 'Surveyor' || formData.Role === 'Both') {
          return formData.License_ID.trim() && !existingLicenseIDs.includes(formData.License_ID);
        }
        return true;
      case 'Role':
        return formData.Role;
      default:
        return true;
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
          <li>Upload a clear photo of the person OR manually enter the image URL</li>
          <li><strong>Image URL Format:</strong> https://storage.googleapis.com/liblandlock/filename.jpg</li>
          <li>After uploading, the image URL will be generated automatically</li>
          <li>Click "Register Person" when all information is complete</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="person-form" noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="DSSN" className="required-field">DSSN (Digital Social Security Number)</label>
            <input
              type="text"
              id="DSSN"
              name="DSSN"
              value={formData.DSSN}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter DSSN (e.g., DSSN123456789)"
              required
              className={!isFieldValid('DSSN') ? 'invalid' : ''}
            />
            <div className="field-note">Must be unique - will be checked automatically</div>
            {!isFieldValid('DSSN') && (
              <div className="field-error">
                {!formData.DSSN.trim() ? 'DSSN is required' : 'This DSSN already exists'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="First_Name" className="required-field">First Name</label>
            <input
              type="text"
              id="First_Name"
              name="First_Name"
              value={formData.First_Name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter first name"
              required
              className={!isFieldValid('First_Name') ? 'invalid' : ''}
            />
            {!isFieldValid('First_Name') && (
              <div className="field-error">First Name is required</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="Last_Name" className="required-field">Last Name</label>
            <input
              type="text"
              id="Last_Name"
              name="Last_Name"
              value={formData.Last_Name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter last name"
              required
              className={!isFieldValid('Last_Name') ? 'invalid' : ''}
            />
            {!isFieldValid('Last_Name') && (
              <div className="field-error">Last Name is required</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="Date_of_Birth">Date of Birth</label>
            <input
              type="date"
              id="Date_of_Birth"
              name="Date_of_Birth"
              value={formData.Date_of_Birth}
              onChange={handleInputChange}
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
              required
              className={!isFieldValid('Role') ? 'invalid' : ''}
            >
              <option value="">Select Role</option>
              <option value="Landowner">Landowner</option>
              <option value="Surveyor">Surveyor</option>
              <option value="Both">Both (Landowner and Surveyor)</option>
            </select>
            {!isFieldValid('Role') && (
              <div className="field-error">Role is required</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="License_ID">License ID (for Surveyors)</label>
            <input
              type="text"
              id="License_ID"
              name="License_ID"
              value={formData.License_ID}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Enter license ID if Surveyor"
              disabled={formData.Role !== 'Surveyor' && formData.Role !== 'Both'}
              className={!isFieldValid('License_ID') ? 'invalid' : ''}
            />
            <div className="field-note">
              Required only for Surveyor role
            </div>
            {!isFieldValid('License_ID') && (
              <div className="field-error">
                {!formData.License_ID.trim() ? 
                  'License ID is required for Surveyors' : 
                  'This License ID already exists'
                }
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="image-upload">Person Photo</label>
            <div className="file-upload-container">
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
            </div>

            <div id="file-url-display" className="file-url-display">
              {imageFile ? imageFile.name : ''}
            </div>

            <div id="image-preview-container" className="image-preview-container">
              <img id="image-preview" src="" alt="Preview" className="image-preview" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Image_URL">Image URL</label>
            <input
              type="text"
              id="Image_URL"
              name="Image_URL"
              value={formData.Image_URL}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="https://storage.googleapis.com/liblandlock/filename.jpg"
            />
            <div className="field-note">
              {uploadedImageUrl 
                ? 'URL generated from uploaded image - you can modify if needed' 
                : 'Enter full image URL manually or upload an image to generate URL'
              }
            </div>
          </div>
        </div>

        {status.message && (
          <div className={`status-message status-${status.type}`}>
            <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
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
              <>
                <i className="fas fa-user-plus"></i>
                Register Person
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PersonTab;
