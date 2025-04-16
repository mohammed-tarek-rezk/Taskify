import React from "react";

const ProfilePhotoSection = () => (
  <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col items-center">
    <img
      src="/profile.png"
      alt="Profile"
      className="w-20 h-20 rounded-full object-cover"
    />
    <div className="flex gap-2 mt-4">
      <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        Upload New Photo
      </button>
      <button className="border px-4 py-2 rounded">Use Gravatar</button>
    </div>
  </div>
);

const PersonalInfoSection = () => (
  <div className="bg-white rounded-xl shadow p-6 mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input
          type="text"
          placeholder="John"
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Last Name</label>
        <input
          type="text"
          placeholder="Doe"
          className="w-full border rounded px-3 py-2"
        />
      </div>
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Email Address</label>
      <input
        type="email"
        placeholder="john.doe@example.com"
        className="w-full border rounded px-3 py-2"
      />
    </div>
    <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
      Save Changes
    </button>
  </div>
);

const SecuritySettingsSection = () => (
  <div className="bg-white rounded-xl shadow p-6">
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        Current Password
      </label>
      <input
        type="password"
        className="w-full border rounded px-3 py-2"
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">New Password</label>
      <input
        type="password"
        className="w-full border rounded px-3 py-2"
      />
      <div className="flex justify-between text-sm mt-2 text-green-600">
        <span>Password Strength</span>
        <span>Strong</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: "90%" }}
        ></div>
      </div>
    </div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="font-medium">Two-factor Authentication</p>
        <p className="text-sm text-gray-500">
          Add an extra layer of security to your account
        </p>
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
      </label>
    </div>
    <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
      Update Security Settings
    </button>
  </div>
);
function Profile() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
      <p className="text-gray-600 mb-6">
        Manage your account settings and preferences
      </p>
      <ProfilePhotoSection />
      <PersonalInfoSection />
      <SecuritySettingsSection />
    </div>
  )
}

export default Profile