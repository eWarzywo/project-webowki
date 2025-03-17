import MessageLink from './messageLink';

export default function Footer() {
    return (
        <>
            <footer className="flex justify-center items-center w-full pt-6 pb-8 px-8 sticky bottom-0 ml-6">
                <div className="flex justify-center items-center w-full">
                    <p className="text-white text-center opacity-40">© 2025 FortTask. All rights reserved.</p>
                </div>
                <MessageLink />
            </footer>
        </>
    );
}
