import React from 'react';
import { Link } from 'react-router-dom';
import auth from '../utils/auth';

const Profile = () => {
  const isLoggedIn = auth.isAuthenticated();

  if (!isLoggedIn) {
    return (
      <div className="text-center mt-20">
        <p className="text-xl text-gray-600 mb-4">Please login to view your profile</p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Track Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Donor Status Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Donation Status</h2>
            <p className="text-gray-600 mb-6">
              View your blood donation history and manage your availability status
            </p>
            <Link
              to="/donor/status"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 w-full"
            >
              View Donation Status
            </Link>
          </div>
        </div>

        {/* Receiver Status Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Request Status</h2>
            <p className="text-gray-600 mb-6">
              Track your blood requests and view matched donors
            </p>
            <Link
              to="/receiver/status"
              className="inline-block bg-pink-600 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-700 w-full"
            >
              View Request Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;