import { useEffect, useState } from "react";
import { ProfilePicture } from "@/components/generalUI/profilePicture";

type leaderboardData = {
    username: string;
    choresDone: number;
}

type ChoreLeaderboardProps = {
    refresh?: boolean;
}

export default function ChoreLeaderboard({ refresh }: ChoreLeaderboardProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [leaderboardData, setLeaderboardData] = useState<leaderboardData[]>([]);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const response = await fetch('/api/household/users/count-chores-done');
                if (!response.ok) {
                    throw new Error(`Error fetching leaderboard data: ${response.statusText}`);
                }
                const data = await response.json();
                setLeaderboardData(data);
            } catch (error) {
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [refresh]);

    return (
        <div className="flex flex-col w-1/4 h-fit justify-center items-start rounded-xl border border-zinc-800 bg-zinc-950 mb-2 p-6">
            <h2 className="text-zinc-50 text-2xl font-semibold w-full text-start">Chore Leaderboard</h2>
            <p className="text-zinc-400 mt-1.5 text-sm pb-6 text-start">See who is winning the chore game!</p>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            {!loading && !error && (
                <div className="flex flex-col gap-2 w-full">
                    {leaderboardData.sort((a, b) => b.choresDone - a.choresDone).map((user, index) => (
                        <div key={index} className="flex justify-between align-center py-2 w-full">
                            <div className="flex items-center">
                                <ProfilePicture />
                                <span className="text-zinc-50 font-semibold">{user.username}</span>
                            </div>
                            {user.choresDone > 0 ? (
                            <span className="text-zinc-400 font-semibold flex items-center justify-center">{user.choresDone} done</span>
                            ) : (
                                <span className="text-zinc-400 font-semibold flex items-center justify-center">No chores</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}