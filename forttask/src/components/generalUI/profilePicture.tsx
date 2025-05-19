'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProfilePictureData {
    id: number;
    name: string;
    imageUrl: string;
    category: string | null;
}

const DEFAULT_PROFILE_PICTURE = {
    id: 0,
    name: 'Default Avatar',
    imageUrl: '/images/avatars/defaultAvatar.png',
    category: 'default',
};

export function ProfilePicture() {
    const [profilePicture, setProfilePicture] = useState<ProfilePictureData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfilePicture = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/user/profilepicture');

                if (response.ok) {
                    const data = await response.json();
                    if (data.profilePicture) {
                        setProfilePicture(data.profilePicture);
                    } else {
                        console.log('User has no profile picture in response data, using default');
                        setProfilePicture(DEFAULT_PROFILE_PICTURE);
                    }
                } else {
                    console.log('User has no profile picture selected, using default');
                    setProfilePicture(DEFAULT_PROFILE_PICTURE);
                }
            } catch (err) {
                console.log('Error fetching profile picture, using default');
                setProfilePicture(DEFAULT_PROFILE_PICTURE);
            } finally {
                setLoading(false);
            }
        };

        fetchProfilePicture();
    }, []);

    return (
        <div className="hover:cursor-pointer rounded-3xl w-[40px] h-[40px] mx-2 overflow-hidden">
            {loading ? (
                <div className="bg-gray-700 w-full h-full flex justify-center items-center">
                    <span className="animate-pulse">...</span>
                </div>
            ) : (
                <Image
                    src={profilePicture?.imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl}
                    alt={profilePicture?.name || DEFAULT_PROFILE_PICTURE.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                />
            )}
        </div>
    );
}
