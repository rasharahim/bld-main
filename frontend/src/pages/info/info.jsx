import React from 'react';
import './info.css';

const Info = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <div className='info-container'>
      <div className='card'>
        <div className='left'>
          <h1>Hello World</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem esse, dolores dolorum harum praesentium ipsum porro dolorem labore magnam tenetur.
          </p>
          <span>Don't have an account?</span>
        </div>

        <div className='right'>
          <h1>User Details</h1>
          <form onSubmit={handleSubmit}>
            <label htmlFor="fullname">Fullname</label>
            <input type="text" id="fullname" placeholder='Enter name as in identification card' required />

            <label htmlFor="dob">Enter Date of Birth</label>
            <input type="date" id="dob" placeholder='DoB as in identification card' required />

            <label htmlFor="age">Enter Age</label>
            <input type="number" id="age" placeholder='Applicable for blood donation for ages 18 and above' min="18" required />

            <label htmlFor="weight">Enter Weight</label>
            <input type="number" id="weight" placeholder='Weight should be greater than 50kg' min="50" required />

            <label htmlFor="bloodtype">Enter Blood Type</label>
            <input type="text" id="bloodtype" placeholder='Blood type' required />

            <label htmlFor="address">Enter Address</label>
            <input type="text" id="address" placeholder='Address' required />

            <button type='submit'>Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Info;