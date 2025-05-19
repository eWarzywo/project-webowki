'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type UserProfile = {
    id: number;
    username: string;
    profilePicture: {
        id: number;
        name: string;
        imageUrl: string;
        category: string | null;
    } | null;
};

type leaderboardData = {
    username: string;
    choresDone: number;
    profilePicture?: {
        id: number;
        name: string;
        imageUrl: string;
        category: string | null;
    } | null;
};

type ChoreLeaderboardProps = {
    refresh?: boolean;
};

const DEFAULT_PROFILE_PICTURE = {
    id: 0,
    name: 'Default Avatar',
    imageUrl: '/images/avatars/defaultAvatar.png',
    category: 'default',
};

export default function ChoreLeaderboard({ refresh }: ChoreLeaderboardProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<leaderboardData[]>([]);
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const leaderboardResponse = await fetch('/api/household/users/count-chores-done');
                if (!leaderboardResponse.ok) {
                    throw new Error(`Error fetching leaderboard data: ${leaderboardResponse.statusText}`);
                }
                const leaderboardData = await leaderboardResponse.json();

                if (session?.user?.householdId) {
                    const profilesResponse = await fetch(
                        `/api/household/users/profiles?householdId=${session.user.householdId}`,
                    );
                    if (profilesResponse.ok) {
                        const profilesData = await profilesResponse.json();
                        setUserProfiles(profilesData);

                        const mergedData = leaderboardData.map((user: leaderboardData) => {
                            const userProfile = profilesData.find(
                                (profile: UserProfile) => profile.username === user.username,
                            );
                            return {
                                ...user,
                                profilePicture: userProfile?.profilePicture || DEFAULT_PROFILE_PICTURE,
                            };
                        });

                        setLeaderboardData(mergedData);
                    } else {
                        setLeaderboardData(leaderboardData);
                    }
                } else {
                    setLeaderboardData(leaderboardData);
                }
            } catch (error) {
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refresh, session?.user?.householdId]);

    return (
        <div className="flex flex-col w-1/4 h-fit justify-center items-start rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-6">
            <h2 className="text-zinc-50 text-2xl font-semibold w-full text-start">Chore Leaderboard</h2>
            <p className="text-zinc-400 mt-1.5 text-sm pb-6 text-start">See who is winning the chore game!</p>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            {!loading && !error && (
                <div className="flex flex-col gap-2 w-full">
                    {leaderboardData
                        .sort((a, b) => b.choresDone - a.choresDone)
                        .map((user, index) => (
                            <div key={index} className="flex justify-between align-center py-2 w-full">
                                <div className="flex items-center">
                                    <div className="hover:cursor-pointer rounded-3xl w-[40px] h-[40px] mx-2 overflow-hidden">
                                        <Image
                                            src={user.profilePicture?.imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl}
                                            alt={user.profilePicture?.name || DEFAULT_PROFILE_PICTURE.name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <span className="text-zinc-50 font-semibold">{user.username}</span>
                                </div>
                                {user.choresDone > 0 ? (
                                    <span className="text-zinc-400 font-semibold flex items-center justify-center">
                                        {user.choresDone} done
                                    </span>
                                ) : (
                                    <span className="text-zinc-400 font-semibold flex items-center justify-center">
                                        No chores
                                    </span>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
