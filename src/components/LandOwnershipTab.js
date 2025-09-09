
import React, { useState, useEffect } from 'react';
import './LandOwnershipTab.css';

function LandOwnershipTab() {
  const [formData, setFormData] = useState({
    Parcel_ID: '',
    owners: ['']
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [existingParcels, setExistingParcels] = useState([]);
  const [existingOwners, setExistingOwners] = useState([]);
  const [existingOwnerships, setExistingOwnerships] = useState([]);
  
  const API_BASE = 'https://api.liblandlock.com';

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    try {
      // Fetch existing parcels
      const parcelsResponse = await fetch(`${API_BASE}/api/land-parcels`);
      if (parcelsResponse.ok) {
        const parcels = await parcelsResponse.json();
        setExistingParcels(parcels);
      }

      // Fetch existing landowners
      const personsResponse = await fetch(`${API_BASE}/api/persons`);
      if (personsResponse.ok) {
        const persons = await personsResponse.json();
        const landowners = persons.filter(p => p.Role === 'Landowner' || p.Role === 'Both');
        setExistingOwners(landowners.map(o => o.DSSN));
      }

      // Fetch existing ownerships
      const ownershipsResponse = await fetch(`${API_BASE}/api/land-ownerships`);
      if (ownershipsResponse.ok) {
        const ownerships = await ownershipsResponse.json();
        setExistingOwnerships(ownerships);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerChange = (index, value) => {
    const newOwners = [...formData.owners];
    newOwners[index] = value;
    setFormData(prev => ({
      ...prev,
      owners: newOwners
    }));
  };

  const addOwner = () => {
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, '']
    }));
  };

  const removeOwner = (index) => {
    if (formData.owners.length <= 1) return;
    
    const newOwners = [...formData.owners];
    newOwners.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      owners: newOwners
    }));
  };

  const validateForm = () => {
    if (!formData.Parcel_ID) {
      setStatus({ message: 'Parcel ID is required', type: 'error' });
      return false;
    }

    // Check if parcel exists
    const parcelExists = existingParcels.some(p => p.Parcel_ID === parseInt(formData.Parcel_ID));
    if (!parcelExists) {
      setStatus({ message: 'Parcel ID does not exist. Please register the land parcel first.', type: 'error' });
      return false;
    }

    // Validate owners
    const validOwners = formData.owners.filter(owner => owner.trim() !== '');
    if (validOwners.length === 0) {
      setStatus({ message: 'At least one owner DSSN is required', type: 'error' });
      return false;
    }

    for (let i = 0; i < validOwners.length; i++) {
      const ownerDSSN = validOwners[i];
      
      // Check if owner exists
      if (!existingOwners.includes(ownerDSSN)) {
        setStatus({ message: `Owner DSSN "${ownerDSSN}" does not exist or is not a landowner. Please register the person first.`, type: 'error' });
        return false;
      }

      // Check if ownership already exists
      const ownershipExists = existingOwnerships.some(
        ownership => ownership.Parcel_ID === parseInt(formData.Parcel_ID) && ownership.Owner_DSSN === ownerDSSN
      );

      if (ownershipExists) {
        setStatus({ message: `Ownership relationship already exists for Parcel ID ${formData.Parcel_ID} and Owner DSSN ${ownerDSSN}`, type: 'error' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setStatus({ message: '', type: '' });

    try {
      const validOwners = formData.owners.filter(owner => owner.trim() !== '');
      const results = [];

      // Submit each ownership relationship
      for (const ownerDSSN of validOwners) {
        const response = await fetch(`${API_BASE}/api/land-ownership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Parcel_ID: formData.Parcel_ID,
            Owner_DSSN: ownerDSSN
          })
        });

        const result = await response.json();
        results.push(result);

        if (!result.success) {
          // Stop on first error
          setStatus({ 
            message: `Error: ${result.message}`, 
            type: 'error' 
          });
          setLoading(false);
          return;
        }
      }

      setStatus({ 
        message: `Successfully created ${results.length} ownership relationship(s)!`, 
        type: 'success' 
      });
      
      // Reset form
      setFormData({
        Parcel_ID: '',
        owners: ['']
      });
      
      // Refresh existing data
      fetchExistingData();
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

  const getParcelDescription = (parcelId) => {
    const parcel = existingParcels.find(p => p.Parcel_ID === parseInt(parcelId));
    if (!parcel) return '';
    return `${parcel.Area_Name} - Plot ${parcel.Plot_Number} (${parcel.County})`;
  };

  return (
    <div className="land-ownership-tab">
      <div className="instructions">
        <h4><i className="fas fa-info-circle"></i> Instructions for Land Ownership Registration</h4>
        <ol>
          <li>Select the <strong>Parcel ID</strong> from the dropdown list</li>
          <li>Add one or more <strong>Owner DSSNs</strong> using the + button</li>
          <li>Each owner must be registered as a Landowner in the system</li>
          <li>The same land parcel can have multiple owners</li>
          <li>Click "Register Ownership" when all information is complete</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="land-ownership-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="Parcel_ID" className="required-field">Parcel ID</label>
            <select
              id="Parcel_ID"
              name="Parcel_ID"
              value={formData.Parcel_ID}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Parcel ID</option>
              {existingParcels.map(parcel => (
                <option key={parcel.Parcel_ID} value={parcel.Parcel_ID}>
                  {parcel.Parcel_ID} - {parcel.Area_Name} (Plot {parcel.Plot_Number})
                </option>
              ))}
            </select>
            {formData.Parcel_ID && (
              <div className="parcel-info">
                <strong>Parcel Details:</strong> {getParcelDescription(formData.Parcel_ID)}
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label className="required-field">Owner DSSNs</label>
            <div className="owners-list">
              {formData.owners.map((owner, index) => (
                <div key={index} className="owner-entry">
                  <div className="owner-input-group">
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => handleOwnerChange(index, e.target.value)}
                      placeholder="Enter owner DSSN"
                      list="owner-dssn-list"
                      required={index === 0}
                    />
                    <datalist id="owner-dssn-list">
                      {existingOwners.map(dssn => (
                        <option key={dssn} value={dssn} />
                      ))}
                    </datalist>
                    {formData.owners.length > 1 && (
                      <button
                        type="button"
                        className="remove-owner-btn"
                        onClick={() => removeOwner(index)}
                        title="Remove owner"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  {owner && !existingOwners.includes(owner) && (
                    <div className="field-error">
                      This DSSN is not registered as a landowner
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              className="add-owner-btn"
              onClick={addOwner}
            >
              <i className="fas fa-plus"></i> Add Another Owner
            </button>
            
            <div className="field-note">
              Add all owners for this land parcel. Each owner must be registered as a Landowner.
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
              'Register Ownership'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LandOwnershipTab;
