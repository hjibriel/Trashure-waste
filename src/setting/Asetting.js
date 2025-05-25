import '../App.css';
import { UserProfile } from '@clerk/clerk-react';

function Asetting() {

  return (
    <div className="settings-container" style={{ marginTop: '100px', marginLeft: '40px' }}>
      <UserProfile/>
    </div>
  );
}

export default Asetting;
