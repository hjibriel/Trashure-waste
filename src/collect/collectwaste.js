import '../App.css';
import React, { useCallback,useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { verifyWasteImage, estimateWasteWeight } from '../utils/imageVerification';

function Collection() {
  const { user } = useUser();
  const [points, setPoints] = useState(0);
  const [activeForm, setActiveForm] = useState('collect');
  const [collectionData, setCollectionData] = useState({ location: '', weight: '', method: 'Self' });
  const [pickupData, setPickupData] = useState({
    preferred_date: '', preferred_time: '', location: '',
    waste_type: '', quantity: '', description: ''
  });
  const [scheduledPickups, setScheduledPickups] = useState([]);
  const [pastCollections, setPastCollections] = useState([]);
  const [editingPickupId, setEditingPickupId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
 
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageVerification, setImageVerification] = useState(null);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [verificationError, setVerificationError] = ('');

  const calculateTotalPoints = useCallback(async () => {
    try {
      const collections = await fetchCollections();
      const userCollections = collections.filter(c => c.user_id === user.id);
      const totalPoints = userCollections.reduce((sum, c) => sum + (c.points_earned || 0), 0);
      setPoints(totalPoints);
    } catch (err) {
      console.error('Error calculating points:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchPickups();
    fetchCollections();
    if (user) calculateTotalPoints();
  }, [user, calculateTotalPoints]);
  

  const fetchPickups = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pickuprequest');
      const data = await res.json();
      setScheduledPickups(data);
      return data;
    } catch (err) {
      console.error('Error fetching pickups:', err);
      return [];
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/collect');
      const data = await res.json();
      setPastCollections(data);
    
      return data;
    } catch (err) {
      console.error('Error fetching collections:', err);
     
      return [];
    }
  };
 
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
   
    if (file.size > 10 * 1024 * 1024) {
      setVerificationError('Image size must be less than 10MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setVerificationError('Please select a valid image file');
      return;
    }

    setSelectedImage(file);
    setImageVerification(null);
    setVerificationError('');
    setIsVerifyingImage(true);

    try {
      const verificationResult = await verifyWasteImage(file);
     
      if (!verificationResult.success) {
        setVerificationError(verificationResult.error);
        setSelectedImage(null);
        return;
      }

      const verification = verificationResult.data;
      setImageVerification(verification);

      if (!verification.isWaste) {
        setVerificationError('This image does not appear to contain waste materials. Please upload an image showing waste or recyclable materials.');
        setSelectedImage(null);
        return;
      }
     
      if (!collectionData.weight && verification.wasteTypes.length > 0) {
        try {
          const weightResult = await estimateWasteWeight(file, verification.wasteTypes);
          if (weightResult.success && weightResult.data.estimatedWeight) {
            setCollectionData(prev => ({
              ...prev,
              weight: weightResult.data.estimatedWeight.toString()
            }));
          }
        } catch (error) {
          console.log('Weight estimation failed, continuing without it');
        }
      }
    } catch (error) {
      console.error('Error during image verification:', error);
      setVerificationError('Failed to verify image. Please try again.');
      setSelectedImage(null);
    } finally {
      setIsVerifyingImage(false);
    }
  };

  const handleMethodChange = (e) => {
    const selectedMethod = e.target.value;
    setCollectionData({ ...collectionData, method: selectedMethod });
    if (selectedMethod === 'Assigned') {
      setPickupData({ ...pickupData, location: collectionData.location });
      setActiveForm('schedule');
    }
  };

  // STANDARDIZED COLLECTION SUBMISSION FUNCTION
  const submitCollection = async (collectionPayload) => {
    try {
      console.log('Submitting collection with payload:', collectionPayload);
      const response = await axios.post('http://localhost:5000/api/collect', collectionPayload);
      console.log('Collection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting collection:', error);
      throw error;
    }
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
   
    if (collectionData.method === 'Self' && (!selectedImage || !imageVerification || !imageVerification.isWaste)) {
      alert('Please upload and verify an image of your waste collection before submitting.');
      return;
    }
   
    setIsSubmitting(true);
    try {
      const earnedPoints = Math.round(parseFloat(collectionData.weight) * 6);
      
      // STANDARDIZED PAYLOAD STRUCTURE
      const payload = {
        user_id: user.id,
        location: collectionData.location,
        weight: parseFloat(collectionData.weight),
        method: collectionData.method,
        points_earned: earnedPoints,
        verified: true,
        waste_types: imageVerification?.wasteTypes || [],
        verification_confidence: imageVerification?.confidence || 0
      };
     
      await submitCollection(payload);
      alert(`Collection submitted! You earned ${earnedPoints} points.`);
      setPoints(prevPoints => prevPoints + earnedPoints);
     
      // Reset form
      setCollectionData({ location: '', weight: '', method: 'Self' });
      setSelectedImage(null);
      setImageVerification(null);
      setVerificationError('');
     
      await fetchCollections();
    } catch (error) {
      console.error('Error submitting collection:', error);
      alert('Failed to submit collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPickupId !== null) {
        const updated = {
          waste_type: pickupData.waste_type,
          quantity: pickupData.quantity,
          description: pickupData.description,
          location: pickupData.location,
          preferred_date: pickupData.preferred_date,
          preferred_time: pickupData.preferred_time
        };
        await axios.put(`http://localhost:5000/api/pickuprequest/${editingPickupId}`, updated);
        setScheduledPickups(scheduledPickups.map(p => p.request_id === editingPickupId ? { ...p, ...updated } : p));
        alert('Pickup updated!');
        setEditingPickupId(null);
      } else {
        const payload = {
          user_id: user.id,
          waste_type: pickupData.waste_type,
          quantity: pickupData.quantity,
          description: pickupData.description,
          location: pickupData.location,
          preferred_date: pickupData.preferred_date,
          preferred_time: pickupData.preferred_time,
          status: 'scheduled'
        };

        let assignedPoints = 0;
        if (collectionData.method === 'Assigned' && collectionData.weight) {
          assignedPoints = Math.round(parseFloat(collectionData.weight) * 10);
          payload.estimatedWeight = parseFloat(collectionData.weight);
          payload.assignedCollection = true;
          payload.isAssigned = true;
        }

        await axios.post('http://localhost:5000/api/pickuprequest', payload);
        await fetchPickups();

        if (assignedPoints > 0) {
          alert(`Pickup scheduled! You'll earn ${assignedPoints} points after completion.`);
        } else {
          alert('Pickup scheduled!');
          setPoints(points + 30);
        }

        if (collectionData.method === 'Assigned') {
          setCollectionData({ location: '', weight: '', method: 'Self' });
        }
      }
      setPickupData({ preferred_date: '', preferred_time: '', location: '', waste_type: '', quantity: '', description: '' });
    } catch (error) {
      console.error('Error submitting pickup:', error);
      alert('Failed to schedule pickup.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleEditPickup = (pickup) => {
    setPickupData({
      preferred_date: pickup.preferred_date,
      preferred_time: pickup.preferred_time,
      location: pickup.location,
      waste_type: pickup.waste_type,
      quantity: pickup.quantity,
      description: pickup.description || '',
    });
    setEditingPickupId(pickup.request_id);
    setActiveForm('schedule');
  };

  const handleDeletePickup = async (id) => {
    if (window.confirm('Delete this pickup?')) {
      try {
        await axios.delete(`http://localhost:5000/api/pickuprequest/${id}`);
        setScheduledPickups(scheduledPickups.filter(p => p.request_id !== id));
        alert('Pickup deleted!');
      } catch (error) {
        console.error('Error deleting pickup:', error);
        alert('Failed to delete pickup.');
      }
    }
  };

  const calculateEstimatedPoints = () => {
    if (!collectionData.weight) return 0;
    const rate = collectionData.method === 'Assigned' ? 10 : 6;
    return Math.round(parseFloat(collectionData.weight) * rate);
  };

  

  return (
    <div className="container" style={{ backgroundColor: "#f9f9f9", minHeight: "100vh", padding: "20px 40px", paddingTop: "80px", marginLeft: "200px", marginRight: "40px" }}>
      <h1 className="header">Waste Collection</h1>
      
      <div className="button-toggle-group">
        <button className={activeForm === 'collect' ? 'active-tab' : ''} onClick={() => setActiveForm('collect')}>Collect</button>
        <button className={activeForm === 'schedule' ? 'active-tab' : ''} onClick={() => setActiveForm('schedule')}>Schedule Pickup</button>
      </div>

      <div className="points-summary">
        <h3>Your Points: {points}</h3>
      </div>

      {activeForm === 'collect' && (
        <div>
          <form onSubmit={handleCollectionSubmit} className="form-container">
            <input
              type="text"
              placeholder="Location of collection"
              value={collectionData.location}
              onChange={(e) => setCollectionData({ ...collectionData, location: e.target.value })}
              required
            />
           
            <div className="image-upload-section" style={{ margin: '15px 0', padding: '15px', border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Upload Image of Waste Collection *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={collectionData.method === 'Self'}
                style={{ marginBottom: '10px' }}
              />
             
              {isVerifyingImage && (
                <div style={{ color: '#007bff', fontStyle: 'italic' }}>
                  🔍 Verifying image with AI...
                </div>
              )}
             
              {verificationError && (
                <div style={{ color: '#dc3545', marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
                  ❌ {verificationError}
                </div>
              )}
             
              {imageVerification && imageVerification.isWaste && (
                <div style={{ color: '#28a745', marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
                  ✅ <strong>Image Verified!</strong>
                  <div style={{ marginTop: '5px', fontSize: '14px' }}>
                    <p><strong>Detected:</strong> {imageVerification.description}</p>
                    <p><strong>Waste Types:</strong> {imageVerification.wasteTypes.join(', ') || 'General waste'}</p>
                    <p><strong>Confidence:</strong> {imageVerification.confidence}%</p>
                  </div>
                </div>
              )}
            </div>

            <input
              type="number"
              step="0.1"
              placeholder="Weight Collected (kg)"
              value={collectionData.weight}
              onChange={(e) => setCollectionData({ ...collectionData, weight: e.target.value })}
              required
            />

            <select value={collectionData.method} onChange={handleMethodChange}>
              <option value="Self">Self Collection (6 pts/kg)</option>
              <option value="Assigned">Assigned Collection (10 pts/kg)</option>
            </select>

            {collectionData.method === 'Self' && (
              <>
                <button
                  type="submit"
                  disabled={isSubmitting || !imageVerification?.isWaste}
                  style={{
                    opacity: (!imageVerification?.isWaste) ? 0.6 : 1,
                    cursor: (!imageVerification?.isWaste) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Collection'}
                </button>
                <div className="earning-summary">
                  This collection will earn you {calculateEstimatedPoints()} points
                </div>
                {!imageVerification?.isWaste && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                    Please upload and verify an image before submitting
                  </div>
                )}
              </>
            )}

            {collectionData.method === 'Assigned' && (
              <div className="note-info">Please fill in the pickup scheduling form for assigned collection.</div>
            )}
          </form>

          <div className="collection-summary" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Collection Summary</h3>
            <div className="summary-content">
              <p><strong>Total Collections:</strong> {pastCollections.filter(c => c.user_id === user?.id).length}</p>
              <p><strong>Total Weight Collected:</strong> {pastCollections.filter(c => c.user_id === user?.id).reduce((sum, c) => sum + parseFloat(c.weight || 0), 0).toFixed(2)} kg</p>
              <p><strong>Total Points Earned:</strong> {points}</p>
            </div>
          </div>
        </div>
      )}

      {activeForm === 'schedule' && (
        <>
          <form onSubmit={handlePickupSubmit} className="form-container">
            <h2>{editingPickupId ? 'Edit Pickup' : collectionData.method === 'Assigned' ? 'Schedule Assigned Collection' : 'Schedule a Waste Pickup'}</h2>
            
            {collectionData.method === 'Assigned' && (
              <div className="assigned-info" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4ff', borderRadius: '5px' }}>
                <p>Scheduling assigned collection of approx. {collectionData.weight} kg at {collectionData.location}</p>
                <p>Expected points: {calculateEstimatedPoints()}</p>
              </div>
            )}

            <label>Waste Type</label>
            <select value={pickupData.waste_type} onChange={(e) => setPickupData({ ...pickupData, waste_type: e.target.value })} required>
              <option value="">Select waste type</option>
              <option value="general">General Waste</option>
              <option value="plastic">Plastic</option>
              <option value="paper">Paper/Cardboard</option>
              <option value="electronics">Electronics</option>
              <option value="glass">Glass</option>
              <option value="metal">Metal</option>
              <option value="hazardous">Hazardous Materials</option>
            </select>

            <label>Quantity</label>
            <select value={pickupData.quantity} onChange={(e) => setPickupData({ ...pickupData, quantity: e.target.value })} required>
              <option value="">Select quantity</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xl">Extra Large</option>
            </select>

            <label>Description</label>
            <textarea rows="3" placeholder="Additional details" value={pickupData.description} onChange={(e) => setPickupData({ ...pickupData, description: e.target.value })} />

            <label>Location</label>
            <input type="text" value={pickupData.location} onChange={(e) => setPickupData({ ...pickupData, location: e.target.value })} required />

            <label>Preferred Date</label>
            <input type="date" value={pickupData.preferred_date} onChange={(e) => setPickupData({ ...pickupData, preferred_date: e.target.value })} required />

            <label>Preferred Time</label>
            <select value={pickupData.preferred_time} onChange={(e) => setPickupData({ ...pickupData, preferred_time: e.target.value })} required>
              <option value="">Select time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : (editingPickupId ? 'Update Pickup' : collectionData.method === 'Assigned' ? 'Schedule Assigned Collection' : 'Schedule Pickup')}
            </button>

            {collectionData.method === 'Assigned' && (
              <button type="button" style={{ marginTop: '10px', backgroundColor: '#6c757d' }} onClick={() => { setCollectionData({ ...collectionData, method: 'Self' }); setActiveForm('collect'); }}>
                Cancel Assigned Collection
              </button>
            )}
          </form>

          <div className="scheduled-pickups">
            <h2>Your Scheduled Pickups</h2>
            {scheduledPickups.filter(p => p.user_id === user.id).length === 0 ? (
              <p>No pickups scheduled.</p>
            ) : (
              scheduledPickups.filter(p => p.user_id === user.id).map((pickup) => (
                <div key={pickup.request_id} className="pickup-card">
                  <p><strong>Waste Type:</strong> {pickup.waste_type}</p>
                  <p><strong>Quantity:</strong> {pickup.quantity}</p>
                  <p><strong>Location:</strong> {pickup.location}</p>
                  <p><strong>Date:</strong> {pickup.preferred_date}</p>
                  <p><strong>Time:</strong> {pickup.preferred_time}</p>
                  <p><strong>Description:</strong> {pickup.description}</p>
                  <p><strong>Status:</strong> {pickup.status || 'Pending'}</p>
                  {pickup.assignedCollection && <p><strong>Type:</strong> Assigned</p>}
                  {pickup.estimatedWeight && <p><strong>Est. Weight:</strong> {pickup.estimatedWeight} kg</p>}
                  {(pickup.status !== 'collected') && (
                    <>
                      <button onClick={() => handleEditPickup(pickup)}>Edit</button>
                      <button onClick={() => handleDeletePickup(pickup.request_id)}>Delete</button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Collection;