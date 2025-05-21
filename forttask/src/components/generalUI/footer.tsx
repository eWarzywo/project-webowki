import MessageLink from './messageLink';
import LogoutButton from './logoutButton';

export default function Footer() {
    return (
        <>
            <footer className="flex justify-around items-center w-full pt-6 pb-8 md:sticky bottom-0">
                <LogoutButton />
                <div className="flex justify-center items-center w-full">
                    <p className="text-white text-center opacity-40">© 2025 FortTask. All rights reserved.</p>
                </div>
                <MessageLink />
            </footer>
        </>
    );
}
