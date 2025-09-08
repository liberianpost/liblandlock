import React, { useState } from 'react';
import PersonTab from './PersonTab';
import LandParcelTab from './LandParcelTab';
import LandOwnershipTab from './LandOwnershipTab';
import DocumentTab from './DocumentTab';
import './LandRegistrationModal.css';

function LandRegistrationModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('person');

  const tabs = [
    { id: 'person', label: 'Person' },
    { id: 'land-parcel', label: 'Land Parcel' },
    { id: 'land-ownership', label: 'Land Ownership' },
    { id: 'document', label: 'Documents' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Land Registration System</h2>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>
        
        <div className="modal-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        
        <div className="modal-body">
          <div className="data-entry-guide">
            <h4><i className="fas fa-info-circle"></i> Data Entry Order</h4>
            <ol>
              <li><strong>Persons</strong> must be registered first (as Landowner, Surveyor, or Both)</li>
              <li>Then register <strong>Land Parcels</strong> (requires Surveyor DSSN)</li>
              <li>Finally establish <strong>Land Ownership</strong> (requires Owner DSSN and Parcel ID)</li>
              <li>Upload supporting <strong>Documents</strong> for land ownership claims</li>
            </ol>
          </div>
          
          {activeTab === 'person' && <PersonTab />}
          {activeTab === 'land-parcel' && <LandParcelTab />}
          {activeTab === 'land-ownership' && <LandOwnershipTab />}
          {activeTab === 'document' && <DocumentTab />}
        </div>
      </div>
    </div>
  );
}

export default LandRegistrationModal;
