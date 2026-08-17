import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useLocation } from '../context/LocationContext';
import { MdMyLocation, MdRoom } from 'react-icons/md';

export default function LocationModal() {
  const { 
    address, 
    manualSetLocation, 
    detectLocation, 
    loading, 
    error, 
    isLocationModalOpen, 
    setIsLocationModalOpen 
  } = useLocation();

  const [inputVal, setInputVal] = useState("");

  // Populate the field with the current address when the modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      setInputVal(address || "");
    }
  }, [isLocationModalOpen, address]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      manualSetLocation(inputVal.trim());
      setIsLocationModalOpen(false);
    }
  };

  const handleDetect = () => {
    detectLocation(
      // onSuccess
      () => {
        setIsLocationModalOpen(false);
      },
      // onFailure
      () => {
        // Keep modal open so the user can enter manually
      }
    );
  };

  return (
    <Modal
      isOpen={isLocationModalOpen}
      onClose={() => setIsLocationModalOpen(false)}
      title="Select Delivery Location"
      size="sm"
    >
      <div className="space-y-5">
        <p className="text-xs text-dark/65 leading-relaxed font-light">
          Specify your delivery address to see accurate product availability, delivery times, and delivery fees.
        </p>

        {/* Geolocation trigger */}
        <button
          type="button"
          onClick={handleDetect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#E2F3F0] hover:bg-[#D4EFEA] text-[#009688] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none shadow-sm disabled:opacity-50"
        >
          <MdMyLocation className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Detecting location..." : "Use Current Location (GPS)"}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark/10"></div>
          </div>
          <span className="relative px-3 bg-white text-[10px] uppercase font-bold text-dark/30 tracking-wider">
            Or enter manually
          </span>
        </div>

        {/* Manual Address Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute top-3 left-3 text-dark/45 text-lg">
              <MdRoom />
            </div>
            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter your location (e.g. Vijayawada, Guntur)"
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 border border-dark/10 rounded-xl text-xs font-semibold placeholder-dark/35 focus:border-[#009688] focus:ring-1 focus:ring-[#009688] outline-none transition-all resize-none text-dark bg-white"
            />
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-red-500 mt-1">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="px-4 py-2 hover:bg-[#F8FCFC] text-dark/65 hover:text-dark font-bold text-xs uppercase rounded-xl transition-all border-none bg-transparent cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              Confirm Location
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
