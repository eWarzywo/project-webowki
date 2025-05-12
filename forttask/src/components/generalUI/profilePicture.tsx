import Image from 'next/image';
import prisma from '../../../libs/prisma';

export async function ProfilePicture() {

  const profilePicture = await prisma.profilePicture.findUnique({
    where: {
      id: 13,
    },
  });
  console.log(profilePicture);

  return (
    <div className="hover:cursor-pointer rounded-3xl w-[40px] h-[40px] mx-2 overflow-hidden">
      {profilePicture ? (
        <Image
          src={profilePicture.imageUrl}
          alt={profilePicture.name}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="bg-white text-black w-full h-full flex justify-center items-center">
          pfp
        </div>
      )}
    </div>
  );
}