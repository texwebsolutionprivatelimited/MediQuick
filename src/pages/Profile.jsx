import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MdEmail, 
  MdPhone, 
  MdRoom, 
  MdPerson, 
  MdCalendarToday,
  MdArrowBack,
  MdEdit,
  MdCameraAlt,
  MdCancel,
  MdLock,
  MdWc,
  MdContactPhone
} from 'react-icons/md';
import Button from '../components/Button';
import Card from '../components/Card';
import { db, storage, isConfigValid } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    gender: '',
    dob: '',
    emergencyContact: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Sync state when currentUser changes or when editing starts
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || currentUser.displayName || currentUser.name || '',
        phone: currentUser.mobileNumber || currentUser.phone || '',
        address: currentUser.location || currentUser.deliveryAddress || currentUser.address || '',
        gender: currentUser.gender || '',
        dob: currentUser.dob || currentUser.dateOfBirth || '',
        emergencyContact: currentUser.emergencyContact || ''
      });
      setImagePreview(currentUser.profileImage || currentUser.photoURL || null);
      setSelectedFile(null);
    }
  }, [currentUser, isEditing]);

  // If not logged in, redirect to login page (safeguard)
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fullName = currentUser.fullName || currentUser.displayName || currentUser.name || 'Not Provided';
  const email = currentUser.email || 'Not Provided';
  const phone = currentUser.mobileNumber || currentUser.phone || 'Not Provided';
  const deliveryAddress = currentUser.location || currentUser.deliveryAddress || currentUser.address || 'Not Provided';
  const gender = currentUser.gender || 'Not Specified';
  const dob = currentUser.dob || currentUser.dateOfBirth || 'Not Specified';
  const emergencyContact = currentUser.emergencyContact || 'Not Specified';

  const role = currentUser.role 
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) 
    : 'User';

  const getCreationDate = () => {
    if (currentUser.createdAt) {
      try {
        return new Date(currentUser.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (_) {}
    }
    if (currentUser.metadata?.creationTime) {
      try {
        return new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (_) {}
    }
    return 'Not Provided';
  };

  const creationDate = getCreationDate();

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast('Supported formats: JPG, PNG, WEBP', 'error');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Maximum image size is 5 MB', 'error');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || currentUser.displayName || currentUser.name || '',
        phone: currentUser.mobileNumber || currentUser.phone || '',
        address: currentUser.location || currentUser.deliveryAddress || currentUser.address || '',
        gender: currentUser.gender || '',
        dob: currentUser.dob || currentUser.dateOfBirth || '',
        emergencyContact: currentUser.emergencyContact || ''
      });
      setImagePreview(currentUser.profileImage || currentUser.photoURL || null);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const trimmedName = formData.fullName.trim();
    const digitsOnlyPhone = formData.phone.trim().replace(/\D/g, '');
    const trimmedAddress = formData.address.trim();

    // Validation 1: Name min 3 chars
    if (trimmedName.length < 3) {
      showToast('Name must be at least 3 characters', 'error');
      return;
    }

    // Validation 2: Phone exactly 10 digits
    if (digitsOnlyPhone.length !== 10) {
      showToast('Invalid Phone Number', 'error');
      return;
    }

    // Validation 3: Address min 10 chars
    if (trimmedAddress.length < 10) {
      showToast('Address must be at least 10 characters', 'error');
      return;
    }

    setIsSaving(true);
    let uploadedImageUrl = currentUser.profileImage || currentUser.photoURL || null;

    // Upload image to Firebase Storage if file selected
    if (selectedFile) {
      if (isConfigValid && storage && currentUser?.uid) {
        try {
          const fileExt = selectedFile.name.split('.').pop() || 'jpg';
          const storageRef = ref(storage, `profileImages/${currentUser.uid}_${Date.now()}.${fileExt}`);
          const snapshot = await uploadBytes(storageRef, selectedFile);
          uploadedImageUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.error("Firebase Storage Upload Error:", err);
          showToast('Failed to Upload Image', 'error');
          setIsSaving(false);
          return;
        }
      } else if (imagePreview) {
        // Fallback for offline/mock mode
        uploadedImageUrl = imagePreview;
      }
    }

    const updatedProfileData = {
      fullName: trimmedName,
      displayName: trimmedName,
      name: trimmedName,
      phone: digitsOnlyPhone,
      mobileNumber: digitsOnlyPhone,
      address: trimmedAddress,
      deliveryAddress: trimmedAddress,
      location: trimmedAddress,
      gender: formData.gender,
      dob: formData.dob,
      dateOfBirth: formData.dob,
      emergencyContact: formData.emergencyContact.trim(),
      ...(uploadedImageUrl ? { profileImage: uploadedImageUrl, photoURL: uploadedImageUrl } : {})
    };

    try {
      if (isConfigValid && db && currentUser?.uid) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, updatedProfileData, { merge: true });
      }

      if (updateUserProfile) {
        updateUserProfile(updatedProfileData);
      }

      showToast('Profile Updated Successfully', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile to Firestore:", err);
      showToast('Network Error. Please Try Again', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#F8FCFC] min-h-[75vh] flex items-center justify-center py-12 px-4 font-sans text-left bg-gradient-soft">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-premium border flex items-center gap-2.5 text-xs font-black select-none tracking-wide transition-all duration-300 animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="w-full max-w-[500px] space-y-6">
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-bold text-dark/60 hover:text-primary transition-colors cursor-pointer select-none"
        >
          <MdArrowBack className="text-base" /> Back
        </button>

        <Card hoverable={false} className="bg-white border border-dark/5 p-6 sm:p-10 rounded-[32px] shadow-premium overflow-hidden relative">
          
          {/* Top-Right Edit Profile / Cancel Button */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
            {!isEditing ? (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer select-none"
              >
                <MdEdit className="text-base" /> Edit Profile
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-bold text-dark/60 hover:text-dark bg-dark/5 hover:bg-dark/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <MdCancel className="text-base" /> Cancel
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start pb-8 border-b border-dark/5">
            
            {/* Avatar Image / Default Icon Container */}
            <div className="relative group shrink-0">
              <div 
                onClick={handleImageClick}
                className={`w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-md select-none overflow-hidden ${
                  isEditing ? 'cursor-pointer ring-4 ring-primary/20 hover:opacity-90' : ''
                }`}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <MdPerson className="text-5xl" />
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-dark/40 text-white flex flex-col items-center justify-center transition-opacity">
                    <MdCameraAlt className="text-xl" />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Change</span>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden" 
              />
            </div>

            {/* Profile Brief Info */}
            <div className="text-center md:text-left space-y-2 pr-12">
              <h1 className="text-2xl font-extrabold text-dark tracking-tight leading-none">
                {isEditing ? (formData.fullName || 'User Name') : fullName}
              </h1>
              <p className="text-xs text-dark/50 leading-relaxed font-light">{email}</p>
              <div className="pt-1.5 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-primary/10 text-primary-dark font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                  {role} Account
                </span>
                {currentUser.role === 'admin' && (
                  <span className="bg-secondary/10 text-secondary-dark font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                    Console Access Enabled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 text-xs sm:text-sm">
            
            {/* Full Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdPerson className="text-base text-dark/35" /> Full Name
              </span>
              {isEditing ? (
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark"
                  required
                />
              ) : (
                <p className="font-semibold text-dark leading-relaxed pl-5">{fullName}</p>
              )}
            </div>

            {/* Email Address (READ-ONLY) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdEmail className="text-base text-dark/35" /> Email Address
              </span>
              {isEditing ? (
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl font-semibold text-dark/50 cursor-not-allowed opacity-75"
                  />
                  <MdLock className="absolute right-3 top-2.5 text-dark/30 text-sm" />
                </div>
              ) : (
                <p className="font-semibold text-dark leading-relaxed pl-5 truncate" title={email}>{email}</p>
              )}
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdPhone className="text-base text-dark/35" /> Contact Number
              </span>
              {isEditing ? (
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark"
                  required
                />
              ) : (
                <p className="font-semibold text-dark leading-relaxed pl-5">{phone}</p>
              )}
            </div>

            {/* Member Since (READ-ONLY) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdCalendarToday className="text-base text-dark/35" /> Member Since
              </span>
              {isEditing ? (
                <div className="relative">
                  <input 
                    type="text"
                    value={creationDate}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl font-semibold text-dark/50 cursor-not-allowed opacity-75"
                  />
                  <MdLock className="absolute right-3 top-2.5 text-dark/30 text-sm" />
                </div>
              ) : (
                <p className="font-semibold text-dark leading-relaxed pl-5">{creationDate}</p>
              )}
            </div>

            {/* Delivery Address */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                <MdRoom className="text-base text-dark/35" /> Primary Delivery Address
              </span>
              {isEditing ? (
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter complete primary delivery address"
                  rows={2}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark resize-none"
                  required
                />
              ) : (
                <p className="font-semibold text-dark leading-relaxed pl-5 leading-normal max-w-xl">{deliveryAddress}</p>
              )}
            </div>

            {/* Optional Fields (Rendered when provided or in edit mode) */}
            {(isEditing || (gender && gender !== 'Not Specified')) && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                  <MdWc className="text-base text-dark/35" /> Gender (Optional)
                </span>
                {isEditing ? (
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="font-semibold text-dark leading-relaxed pl-5">{gender}</p>
                )}
              </div>
            )}

            {(isEditing || (dob && dob !== 'Not Specified')) && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                  <MdCalendarToday className="text-base text-dark/35" /> Date of Birth (Optional)
                </span>
                {isEditing ? (
                  <input 
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark"
                  />
                ) : (
                  <p className="font-semibold text-dark leading-relaxed pl-5">{dob}</p>
                )}
              </div>
            )}

            {(isEditing || (emergencyContact && emergencyContact !== 'Not Specified')) && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-dark/45 uppercase tracking-wide flex items-center gap-1.5">
                  <MdContactPhone className="text-base text-dark/35" /> Emergency Contact (Optional)
                </span>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact phone number"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-dark/5 border border-dark/10 rounded-xl focus:outline-none focus:border-primary font-semibold text-dark"
                  />
                ) : (
                  <p className="font-semibold text-dark leading-relaxed pl-5">{emergencyContact}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-8 mt-4 border-t border-dark/5 sm:col-span-2 flex flex-wrap gap-3 justify-end items-center">
              {isEditing ? (
                <>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="py-3 px-5 border border-dark/10 text-dark/70 hover:bg-dark/5 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </Button>

                  <Button 
                    type="submit"
                    variant="primary" 
                    disabled={isSaving}
                    className="py-3.5 px-6 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  type="button"
                  variant="primary" 
                  onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/')} 
                  className="py-3.5 px-6 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow"
                >
                  {currentUser.role === 'admin' ? 'Go to Admin Console' : 'Continue Shopping'}
                </Button>
              )}
            </div>
          </form>

        </Card>

      </div>
    </div>
  );
}
