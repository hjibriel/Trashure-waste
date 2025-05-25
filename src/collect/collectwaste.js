import '../App.css';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  const [collectingPickupId, setCollectingPickupId] = useState(null);

  useEffect(() => {
    fetchPickups();
    fetchCollections();
    if (user) calculateTotalPoints();
  }, [user]);

  const calculateTotalPoints = async () => {
    try {
      const collections = await fetchCollections();
      const userCollections = collections.filter(c => c.user_id === user.id);
      const totalPoints = userCollections.reduce((sum, c) => sum + (c.points_earned || 0), 0);
      setPoints(totalPoints);
    } catch (err) {
      console.error('Error calculating points:', err);
    }
  };

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
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/collect');
      const data = await res.json();
      setPastCollections(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Error fetching collections:', err);
      setLoading(false);
      return [];
    }
  };

  // Unified collection submission function
  const submitCollection = async (collectionPayload, earnedPoints, pickupId = null) => {
    try {
      await axios.post('http://localhost:5000/api/collect', collectionPayload);
      
      // If this was from a scheduled pickup, mark it as collected
      if (pickupId) {
        await axios.put(`http://localhost:5000/api/pickuprequest/${pickupId}`, { status: 'Collected' });
        setScheduledPickups(scheduledPickups.filter(p => p.request_id !== pickupId));
      }
      
      setPoints(points + earnedPoints);
      await fetchCollections(); // Refresh collections list
      
      return earnedPoints;
    } catch (error) {
      console.error('Error submitting collection:', error);
      throw error;
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

  // Submit direct collection (self-collection)
  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const earnedPoints = Math.round(parseFloat(collectionData.weight) * 6);
      const payload = {
        user_id: user.id,
        location: collectionData.location,
        weight: parseFloat(collectionData.weight),
        method: collectionData.method,
        points_earned: earnedPoints
      };
      
      await axios.post('http://localhost:5000/api/collect', payload);
      setPoints(points + earnedPoints);
      await fetchCollections(); // Refresh collections list
      alert(`Collection submitted! You earned ${earnedPoints} points.`);
      setCollectionData({ location: '', weight: '', method: 'Self' });
    } catch (error) {
      console.error('Collection error:', error.response || error);
      alert(`Failed to submit collection: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit new or edit pickup schedule
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
          preferred_time: pickupData.preferred_time
        };

        let assignedPoints = 0;
        if (collectionData.method === 'Assigned' && collectionData.weight) {
          assignedPoints = Math.round(parseFloat(collectionData.weight) * 10);
          payload.estimatedWeight = parseFloat(collectionData.weight);
          payload.assignedCollection = true;
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

  // NEW: Unified collection handler for scheduled waste
  const handleCollectScheduledWaste = async (pickup, actualWeight) => {
    if (!actualWeight || actualWeight <= 0) {
      alert('Please enter a valid weight for the collected waste.');
      return;
    }

    setCollectingPickupId(pickup.request_id);
    try {
      // Use the same point calculation as direct collection (6 pts/kg for self-collection)
      const earnedPoints = Math.round(parseFloat(actualWeight) * 6);
      
      // Try the full payload first
      let collectionPayload = {
        user_id: user.id,
        location: pickup.location,
        weight: parseFloat(actualWeight),
        method: 'Self',
        points_earned: earnedPoints,
        pickup_request_id: pickup.request_id,
        waste_type: pickup.waste_type,
        collected_date: new Date().toISOString().split('T')[0],
        collected_time: new Date().toTimeString().split(' ')[0]
      };

      console.log('Attempting collection with full payload:', collectionPayload);

      let collectionResponse;
      try {
        // Try with full payload first
        collectionResponse = await axios.post('http://localhost:5000/api/collect', collectionPayload);
      } catch (fullPayloadError) {
        console.log('Full payload failed, trying minimal payload...');
        
        // If full payload fails, try minimal payload (same as direct collection)
        const minimalPayload = {
          user_id: user.id,
          location: pickup.location,
          weight: parseFloat(actualWeight),
          method: 'Self',
          points_earned: earnedPoints
        };
        
        console.log('Attempting collection with minimal payload:', minimalPayload);
        collectionResponse = await axios.post('http://localhost:5000/api/collect', minimalPayload);
      }
      
      console.log('Collection successful:', collectionResponse.data);
      
      // Then update the pickup status to 'Collected'
      const statusPayload = { status: 'Collected' };
      console.log('Updating pickup status:', statusPayload);
      
      try {
        const statusResponse = await axios.put(`http://localhost:5000/api/pickuprequest/${pickup.request_id}`, statusPayload);
        console.log('Status update successful:', statusResponse.data);
      } catch (statusError) {
        console.warn('Status update failed, but collection was successful:', statusError);
        // Don't throw here - collection was successful, status update is secondary
      }
      
      // Update local state immediately to reflect the change
      setScheduledPickups(prevPickups => 
        prevPickups.map(p => 
          p.request_id === pickup.request_id 
            ? { ...p, status: 'Collected' }
            : p
        )
      );
      
      setPoints(points + earnedPoints);
      await fetchCollections(); // Refresh collections list
      alert(`Scheduled waste collected! You earned ${earnedPoints} points.`);
      
    } catch (error) {
      console.error('Collection error details:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Try to get more specific error message
        let errorMessage = 'Server error';
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
        
        alert(`Failed to collect scheduled waste: ${errorMessage}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        alert('Failed to collect scheduled waste: No response from server');
      } else {
        console.error('Error message:', error.message);
        alert(`Failed to collect scheduled waste: ${error.message}`);
      }
    } finally {
      setCollectingPickupId(null);
    }
  };

  const handleEditPickup = (pickup) => {
    // Prevent editing if the pickup has been collected
    if (pickup.status && pickup.status.toLowerCase() === 'collected') {
      alert('Cannot edit collected waste pickups.');
      return;
    }

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

  const handleDeletePickup = async (pickup) => {
    // Prevent deletion if the pickup has been collected
    if (pickup.status && pickup.status.toLowerCase() === 'collected') {
      alert('Cannot delete collected waste pickups.');
      return;
    }

    if (window.confirm('Delete this pickup?')) {
      try {
        await axios.delete(`http://localhost:5000/api/pickuprequest/${pickup.request_id}`);
        setScheduledPickups(scheduledPickups.filter(p => p.request_id !== pickup.request_id));
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

  // Filter scheduled pickups that are NOT collected yet
  const uncollectedScheduledPickups = scheduledPickups.filter(p => 
    p.user_id === user?.id && (!p.status || p.status.toLowerCase() !== 'collected')
  );

  // Filter all user's scheduled pickups (including collected ones for display)
  const userScheduledPickups = scheduledPickups.filter(p => p.user_id === user?.id);

  return (
    <div className="container" style={{ backgroundColor: "#f9f9f9", minHeight: "100vh", padding: "20px 40px", paddingTop: "80px", marginLeft: "200px", marginRight: "40px" }}>
      <h1 className="header">Waste Collection</h1>

      <div className="button-toggle-group" style={{ marginBottom: 20 }}>
        <button className={activeForm === 'collect' ? 'active-tab' : ''} onClick={() => setActiveForm('collect')}>Collect</button>
        <button className={activeForm === 'schedule' ? 'active-tab' : ''} onClick={() => setActiveForm('schedule')}>Schedule Pickup</button>
        <button className={activeForm === 'collectScheduled' ? 'active-tab' : ''} onClick={() => setActiveForm('collectScheduled')}>Collect Scheduled Waste</button>
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
            <input type="file" accept="image/*" />
            <input
              type="number"
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
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Collection'}</button>
                <div className="earning-summary">This collection will earn you {calculateEstimatedPoints()} points</div>
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
              <option value="Plastic">Plastic</option>
              <option value="Glass">Glass</option>
              <option value="Paper">Paper</option>
              <option value="Metal">Metal</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantity (number of items)"
              value={pickupData.quantity}
              onChange={(e) => setPickupData({ ...pickupData, quantity: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={pickupData.location}
              onChange={(e) => setPickupData({ ...pickupData, location: e.target.value })}
              required
            />
            <input
              type="date"
              value={pickupData.preferred_date}
              onChange={(e) => setPickupData({ ...pickupData, preferred_date: e.target.value })}
              required
            />
            <input
              type="time"
              value={pickupData.preferred_time}
              onChange={(e) => setPickupData({ ...pickupData, preferred_time: e.target.value })}
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={pickupData.description}
              onChange={(e) => setPickupData({ ...pickupData, description: e.target.value })}
            />

            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : editingPickupId ? 'Update Pickup' : 'Schedule Pickup'}</button>
          </form>

          <div className="scheduled-list" style={{ marginTop: '30px' }}>
            <h3>Your Scheduled Pickups</h3>
            {userScheduledPickups.length === 0 ? (
              <p>No scheduled pickups yet.</p>
            ) : (
              userScheduledPickups.map(pickup => {
                const isCollected = pickup.status && pickup.status.toLowerCase() === 'collected';
                return (
                  <div 
                    key={pickup.request_id} 
                    className="pickup-card" 
                    style={{ 
                      border: '1px solid #ddd', 
                      padding: '10px', 
                      marginBottom: '10px', 
                      borderRadius: '6px',
                      backgroundColor: isCollected ? '#f0f0f0' : '#fff',
                      opacity: isCollected ? 0.7 : 1
                    }}
                  >
                    <p><strong>Waste Type:</strong> {pickup.waste_type}</p>
                    <p><strong>Quantity:</strong> {pickup.quantity}</p>
                    <p><strong>Location:</strong> {pickup.location}</p>
                    <p><strong>Date:</strong> {pickup.preferred_date}</p>
                    <p><strong>Time:</strong> {pickup.preferred_time}</p>
                    <p><strong>Description:</strong> {pickup.description || 'N/A'}</p>
                    <p><strong>Status:</strong> <span style={{ color: isCollected ? '#4CAF50' : '#666' }}>{pickup.status || 'Pending'}</span></p>
                    
                    {!isCollected ? (
                      <div>
                        <button onClick={() => handleEditPickup(pickup)}>Edit</button>
                        <button onClick={() => handleDeletePickup(pickup)} style={{ marginLeft: '10px' }}>Delete</button>
                      </div>
                    ) : (
                      <div style={{ color: '#666', fontStyle: 'italic', marginTop: '10px' }}>
                        This pickup has been collected and cannot be modified.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {activeForm === 'collectScheduled' && (
        <div className="collect-scheduled" style={{ marginTop: '20px' }}>
          <h2>Scheduled Waste Available for Collection</h2>
          {uncollectedScheduledPickups.length === 0 ? (
            <p>No scheduled waste awaiting collection.</p>
          ) : (
            uncollectedScheduledPickups.map(pickup => (
              <ScheduledWasteCard 
                key={pickup.request_id} 
                pickup={pickup} 
                onCollect={handleCollectScheduledWaste}
                isCollecting={collectingPickupId === pickup.request_id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// NEW: Separate component for scheduled waste collection
function ScheduledWasteCard({ pickup, onCollect, isCollecting }) {
  const [actualWeight, setActualWeight] = useState('');

  const handleCollect = () => {
    onCollect(pickup, actualWeight);
    setActualWeight(''); // Reset after collection
  };

  return (
    <div className="pickup-card" style={{ 
      border: '1px solid #ccc', 
      padding: '15px', 
      marginBottom: '12px', 
      borderRadius: '6px', 
      backgroundColor: '#fff' 
    }}>
      <p><strong>Waste Type:</strong> {pickup.waste_type}</p>
      <p><strong>Quantity:</strong> {pickup.quantity}</p>
      <p><strong>Location:</strong> {pickup.location}</p>
      <p><strong>Date:</strong> {pickup.preferred_date}</p>
      <p><strong>Time:</strong> {pickup.preferred_time}</p>
      <p><strong>Description:</strong> {pickup.description || 'N/A'}</p>
      
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="number"
          step="0.1"
          min="0.1"
          placeholder="Actual weight (kg)"
          value={actualWeight}
          onChange={(e) => setActualWeight(e.target.value)}
          style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        <button 
          onClick={handleCollect}
          disabled={isCollecting || !actualWeight}
          style={{ 
            padding: '8px 16px',
            backgroundColor: actualWeight ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: actualWeight ? 'pointer' : 'not-allowed'
          }}
        >
          {isCollecting ? 'Collecting...' : 'Collect'}
        </button>
      </div>
      
      {actualWeight && (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
          You'll earn {Math.round(parseFloat(actualWeight) * 6)} points (6 pts/kg)
        </div>
      )}
    </div>
  );
}

export default Collection;