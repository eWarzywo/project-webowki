'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    username: string;
    email: string;
}

interface Household {
    id: number;
    name: string;
    joinCode: string;
    ownerId: number;
}

export default function Management() {
    const [activeSection, setActiveSection] = useState('Account');

    return (
        <div className="flex flex-col w-full bg-zinc-950 text-white p-4">
            <div>
                <h1 className="text-2xl font-bold">Management</h1>
                <p className="text-zinc-400 mb-6">Manage your account settings and set email preferences.</p>
            </div>
            <div className="flex flex-col md:flex-row w-full">
                <ManagementSideBar activeSection={activeSection} setActiveSection={setActiveSection} />
                <ContentSection activeSection={activeSection} />
            </div>
        </div>
    );
}

interface SideBarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
}

function ManagementSideBar({ activeSection, setActiveSection }: SideBarProps) {
    const sections = ['Account', 'Profile Picture', 'Household'];

    return (
        <div className="w-full md:w-48 lg:w-56 mb-6 md:mb-0">
            <ul className="flex md:flex-col overflow-x-auto md:overflow-visible space-x-2 md:space-x-0 md:space-y-2 pb-2 md:pb-0">
                {sections.map((section) => (
                    <li
                        key={section}
                        className={`p-2 rounded-[6px] cursor-pointer transition-colors duration-200 whitespace-nowrap md:whitespace-normal ${
                            activeSection === section ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                        }`}
                        onClick={() => setActiveSection(section)}
                    >
                        {section}
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface ContentProps {
    activeSection: string;
}

function ContentSection({ activeSection }: ContentProps) {
    return (
        <div className="flex-1 pb-8">
            {activeSection === 'Account' && <AccountContent />}
            {activeSection === 'Profile Picture' && <ProfilePicture />}
            {activeSection === 'Household' && <HouseholdContent />}
        </div>
    );
}

function AccountContent() {
    const { data: session } = useSession();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        async function fetchUserData() {
            if (!session?.user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/user?userId=${session.user.id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const userData = await response.json();
                setUsername(userData.username || '');
                setEmail(userData.email || '');
            } catch (error) {
                console.error('Error fetching user data:', error);
                setMessage({ text: 'Failed to load user data. Please try again.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, [session]);

    const handleUpdateProfile = async () => {
        if (!session?.user?.id) return;

        try {
            setUpdateLoading(true);
            setMessage({ text: '', type: '' });

            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: parseInt(session.user.id),
                    username,
                    email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({
                text: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
                type: 'error',
            });
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <div className="flex-1 md:ml-6 ml-0">
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-1">Account</h2>
                <p className="text-zinc-400 text-sm">Manage your account.</p>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading user data...</div>
            ) : (
                <>
                    {message.text && (
                        <div
                            className={`mb-4 p-2 rounded-[6px] ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm mb-2">Username</label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your new username"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] p-2 text-zinc-400 text-sm font-normal"
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                            This is your public display name. It can be your real name or a pseudonym. You can only
                            change this once every 30 days.
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your new email"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] p-2 text-zinc-400 text-sm font-normal"
                        />

                        <p className="text-xs text-zinc-400 mt-1">
                            You can change your email address here. Make sure to use a valid email address that you have
                            access to.
                        </p>
                    </div>

                    <div>
                        <button
                            className={`bg-zinc-50 text-zinc-900 px-4 py-2 rounded-[6px] hover:bg-zinc-100 text-sm font-normal ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleUpdateProfile}
                            disabled={updateLoading}
                        >
                            {updateLoading ? 'Updating...' : 'Update profile'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function ProfilePicture() {
    const { data: session } = useSession();
    const [profilePictures, setProfilePictures] = useState<
        { id: number; name: string; imageUrl: string; category: string | null }[]
    >([]);
    const [selectedPicture, setSelectedPicture] = useState<number | null>(null);
    const [currentPicture, setCurrentPicture] = useState<{
        id: number;
        name: string;
        imageUrl: string;
        category: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const defaultAvatar = {
        id: 0,
        name: 'Default Avatar',
        imageUrl: '/images/avatars/defaultAvatar.png',
        category: 'default',
    };

    useEffect(() => {
        async function fetchProfilePictures() {
            try {
                setLoading(true);
                const picResponse = await fetch('/api/user/profilepictures');
                if (!picResponse.ok) {
                    throw new Error('Failed to fetch profile pictures');
                }
                const picData = await picResponse.json();

                if (picData.profilePictures) {
                    const uniquePictures = picData.profilePictures;
                    setProfilePictures(uniquePictures);
                }

                const userPicResponse = await fetch('/api/user/profilepicture');
                if (userPicResponse.ok) {
                    const userData = await userPicResponse.json();
                    if (userData.profilePicture) {
                        setCurrentPicture(userData.profilePicture);
                        setSelectedPicture(userData.profilePicture.id);
                    } else {
                        setSelectedPicture(0);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile pictures:', error);
                setMessage({ text: 'Failed to load profile pictures. Please try again.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        fetchProfilePictures();
    }, []);

    const handleSelectPicture = (pictureId: number) => {
        setSelectedPicture(pictureId);
    };

    const handleSaveProfilePicture = async () => {
        if (!session?.user?.id || selectedPicture === null) return;

        try {
            setSaving(true);
            setMessage({ text: '', type: '' });

            const response = await fetch('/api/user/profilepicture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: parseInt(session.user.id),
                    profilePictureId: selectedPicture,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile picture');
            }

            const updatedData = await response.json();
            setCurrentPicture(updatedData.profilePicture);
            setMessage({ text: 'Profile picture updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error updating profile picture:', error);
            setMessage({
                text: error instanceof Error ? error.message : 'Failed to update profile picture. Please try again.',
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 md:ml-6 ml-0">
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-1">Profile Picture</h2>
                <p className="text-zinc-400 text-sm">Choose an avatar for your profile.</p>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading avatars...</div>
            ) : (
                <>
                    {message.text && (
                        <div
                            className={`mb-4 p-2 rounded-[6px] ${
                                message.type === 'error'
                                    ? 'bg-red-900/50 text-red-200'
                                    : 'bg-green-900/50 text-green-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Current Avatar</h3>
                        <div className="flex items-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-zinc-800">
                                <img
                                    src={currentPicture?.imageUrl || defaultAvatar.imageUrl}
                                    alt={currentPicture?.name || 'Default Avatar'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm">{currentPicture?.name || 'Default Avatar'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Choose a New Avatar</h3>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                            <div
                                key="default-avatar"
                                onClick={() => handleSelectPicture(0)}
                                className={`cursor-pointer transition-all duration-200 p-1 rounded-lg ${
                                    selectedPicture === 0 ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'hover:bg-zinc-800'
                                }`}
                            >
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden bg-zinc-800">
                                    <img
                                        src={defaultAvatar.imageUrl}
                                        alt={defaultAvatar.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-xs text-center mt-1 truncate">{defaultAvatar.name}</p>
                            </div>

                            {profilePictures.map((picture) => (
                                <div
                                    key={picture.id}
                                    onClick={() => handleSelectPicture(picture.id)}
                                    className={`cursor-pointer transition-all duration-200 p-1 rounded-lg ${
                                        selectedPicture === picture.id
                                            ? 'bg-blue-500/20 ring-2 ring-blue-500'
                                            : 'hover:bg-zinc-800'
                                    }`}
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden bg-zinc-800">
                                        <img
                                            src={picture.imageUrl}
                                            alt={picture.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-xs text-center mt-1 truncate">{picture.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <button
                            className={`bg-zinc-50 text-zinc-900 px-4 py-2 rounded-[6px] hover:bg-zinc-100 text-sm font-normal ${
                                saving ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={handleSaveProfilePicture}
                            disabled={
                                saving ||
                                selectedPicture === currentPicture?.id ||
                                (selectedPicture === 0 && currentPicture === null)
                            }
                        >
                            {saving ? 'Saving...' : 'Save Profile Picture'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function HouseholdContent() {
    const { data: session } = useSession();
    const [household, setHousehold] = useState<Household | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [newHouseholdName, setNewHouseholdName] = useState('');
    const [newJoinCode, setNewJoinCode] = useState('');
    const [updateMessage, setUpdateMessage] = useState({ text: '', type: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchHouseholdData() {
            if (!session?.user?.householdId) {
                setLoading(false);
                setError("You don't belong to any household.");
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/household?householdId=${session.user.householdId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch household data');
                }

                const householdData = await response.json();
                setHousehold(householdData);
                setNewHouseholdName(householdData.name || '');
                setNewJoinCode(householdData.joinCode || '');

                const userResponse = await fetch(`/api/household/users?householdId=${session.user.householdId}`);
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch household members');
                }

                const userData = await userResponse.json();
                setUsers(userData);
            } catch (error) {
                console.error('Error fetching household data:', error);
                setError('Failed to load household data. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchHouseholdData();
    }, [session]);

    const handleUpdateHousehold = async () => {
        if (!household?.id) return;

        try {
            setUpdateMessage({ text: '', type: '' });

            const response = await fetch('/api/household', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: household.id,
                    name: newHouseholdName,
                    joinCode: newJoinCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update household settings');
            }

            const updatedHousehold = await response.json();
            setHousehold(updatedHousehold);
            setUpdateMessage({ text: 'Household settings updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error updating household:', error);
            setUpdateMessage({
                text: error instanceof Error ? error.message : 'Failed to update household settings. Please try again.',
                type: 'error',
            });
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!confirm('Are you sure you want to remove this member from the household?')) return;

        if (!household?.id || !userId) return;

        try {
            const response = await fetch(`/api/user?userId=${userId}&householdId=${household.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to remove member');
            }

            setUsers(users.filter((user) => user.id !== userId));
            setUpdateMessage({ text: 'Member removed successfully!', type: 'success' });
        } catch (error) {
            console.error('Error removing member:', error);
            setUpdateMessage({
                text: 'Failed to remove member. Please try again.',
                type: 'error',
            });
        }
    };

    const handleDeleteHousehold = async () => {
        if (!household?.id) return;

        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            const response = await fetch(`/api/household?householdId=${household.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete household');
            }

            setUpdateMessage({ text: 'Household deleted successfully! Redirecting...', type: 'success' });

            setTimeout(() => {
                window.location.href = '/household';
            }, 2000);
        } catch (error) {
            console.error('Error deleting household:', error);
            setUpdateMessage({
                text: 'Failed to delete household. Please try again.',
                type: 'error',
            });
            setConfirmDelete(false);
        }
    };

    const handleLeaveHousehold = async () => {
        if (!session?.user?.id || !household?.id) return;

        if (!confirmLeave) {
            setConfirmLeave(true);
            return;
        }

        try {
            const response = await fetch(`/api/household/users?userId=${session.user.id}&householdId=${household.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to leave household');
            }

            setUpdateMessage({ text: 'You have left the household successfully! Redirecting...', type: 'success' });

            await fetch('/api/auth/session?update=true');

            setTimeout(() => {
                router.push('/household');
            }, 2000);
        } catch (error) {
            console.error('Error leaving household:', error);
            setUpdateMessage({
                text: 'Failed to leave the household. Please try again.',
                type: 'error',
            });
            setConfirmLeave(false);
        }
    };

    const isOwner = household?.ownerId === (session?.user?.id ? parseInt(session.user.id) : undefined);

    if (loading) {
        return (
            <div className="flex-1 ml-6">
                <div className="text-center py-8">Loading household data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 ml-6">
                <div className="text-center py-8">{error}</div>
                <div className="mt-4 text-center">
                    <a
                        href="/household"
                        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-[6px] hover:bg-zinc-100 text-sm font-normal"
                    >
                        Create or Join a Household
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 md:ml-6 ml-0">
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-1">Household</h2>
                <p className="text-zinc-400 text-sm">Manage your household settings.</p>
            </div>

            {updateMessage.text && (
                <div
                    className={`mb-4 p-2 rounded-[6px] ${updateMessage.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}
                >
                    {updateMessage.text}
                </div>
            )}

            {household && (
                <>
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Household Settings</h3>

                        <div className="bg-zinc-900/30 p-4 rounded-[6px] mb-4">
                            <div className="mb-4">
                                <label className="block text-sm mb-2">Household Name</label>
                                <input
                                    type="text"
                                    value={newHouseholdName}
                                    onChange={(e) => setNewHouseholdName(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] p-2 text-zinc-400 text-sm font-normal"
                                    disabled={!isOwner}
                                />
                                {!isOwner && (
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Only the household owner can edit the household name.
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm mb-2">Join Code</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={newJoinCode}
                                        onChange={(e) => setNewJoinCode(e.target.value.toUpperCase())}
                                        className="grow bg-zinc-950 border border-zinc-800 rounded-l-[6px] p-2 text-zinc-400 text-sm font-normal mr-1"
                                        disabled={!isOwner}
                                        maxLength={8}
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(newJoinCode);
                                            setUpdateMessage({
                                                text: 'Join code copied to clipboard!',
                                                type: 'success',
                                            });
                                            setTimeout(() => setUpdateMessage({ text: '', type: '' }), 2000);
                                        }}
                                        className="bg-zinc-800 text-white px-3 py-2 rounded-r-[6px] text-sm"
                                        title="Copy join code"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Share this code with people you want to add to your household.
                                    {!isOwner && ' Only the household owner can edit the join code.'}
                                </p>
                            </div>

                            {isOwner && (
                                <div className="mt-4">
                                    <button
                                        onClick={handleUpdateHousehold}
                                        className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-[6px] hover:bg-zinc-100 text-sm font-normal"
                                    >
                                        Save Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Household Members</h3>

                        <div className="bg-zinc-900/30 p-4 rounded-[6px]">
                            {users.length === 0 ? (
                                <p className="text-zinc-400">No members found.</p>
                            ) : (
                                <ul className="divide-y divide-zinc-800">
                                    {users.map((user) => (
                                        <li
                                            key={user.id}
                                            className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between"
                                        >
                                            <div className="w-full sm:w-auto mb-2 sm:mb-0">
                                                <span className="break-all">{user.username || user.email}</span>
                                                {user.id === household.ownerId && (
                                                    <span className="ml-2 bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded-full text-xs">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>

                                            {isOwner && user.id !== household.ownerId && (
                                                <button
                                                    onClick={() => handleRemoveMember(user.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                    title="Remove member"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-4">
                                <p className="text-sm text-zinc-400">
                                    New members can join by using the join code: <strong>{household.joinCode}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {isOwner ? (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-3 text-red-500">Danger Zone</h3>

                            <div className="bg-red-900/30 border border-red-800 p-4 rounded-[6px]">
                                <p className="text-sm mb-4 text-zinc-300">
                                    Deleting your household will remove all members and all associated data. This action
                                    cannot be undone.
                                </p>

                                {confirmDelete ? (
                                    <div className="flex flex-wrap gap-2">
                                        <p className="text-red-300 mb-2 w-full">
                                            Are you sure? This will permanently delete your household.
                                        </p>
                                        <button
                                            onClick={handleDeleteHousehold}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-[6px] text-sm"
                                        >
                                            Yes, Delete Household
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-[6px] text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDeleteHousehold}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-[6px] text-sm"
                                    >
                                        Delete Household
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-3 text-amber-500">Leave Household</h3>

                            <div className="bg-amber-900/30 border border-amber-800 p-4 rounded-[6px]">
                                <p className="text-sm mb-4 text-zinc-300">
                                    Leaving the household will remove you from all household activities. You can join
                                    again with an invitation code from the owner.
                                </p>

                                {confirmLeave ? (
                                    <div className="flex flex-wrap gap-2">
                                        <p className="text-amber-300 mb-2 w-full">
                                            Are you sure you want to leave this household?
                                        </p>
                                        <button
                                            onClick={handleLeaveHousehold}
                                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-[6px] text-sm"
                                        >
                                            Yes, Leave Household
                                        </button>
                                        <button
                                            onClick={() => setConfirmLeave(false)}
                                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-[6px] text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLeaveHousehold}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-[6px] text-sm"
                                    >
                                        Leave Household
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
