import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding profile pictures...');

    await prisma.profilePicture.deleteMany();

    const profilePictures = [
        // Avatars
        { name: 'Default Avatar 1', imageUrl: '/images/avatars/avatar1.jpg', category: 'avatar' },
        { name: 'Default Avatar 2', imageUrl: '/images/avatars/avatar2.jpg', category: 'avatar' },
        { name: 'Default Avatar 3', imageUrl: '/images/avatars/avatar3.jpg', category: 'avatar' },
        { name: 'Default Avatar 4', imageUrl: '/images/avatars/avatar4.jpg', category: 'avatar' },
        { name: 'Default Avatar 5', imageUrl: '/images/avatars/avatar5.png', category: 'avatar' },

        // Animals
        { name: 'Cat', imageUrl: '/images/avatars/cat.png', category: 'animal' },
        { name: 'Dog', imageUrl: '/images/avatars/dog.png', category: 'animal' },
        { name: 'Rabbit', imageUrl: '/images/avatars/rabbit.png', category: 'animal' },
        { name: 'Fox', imageUrl: '/images/avatars/fox.png', category: 'animal' },

        // Funny
        { name: 'Smiley Face', imageUrl: '/images/avatars/smiley.png', category: 'funny' },
        { name: 'Cool Face', imageUrl: '/images/avatars/cool.png', category: 'funny' },
        { name: 'Thinking Face', imageUrl: '/images/avatars/thinking.png', category: 'funny' },
    ];

    for (const picture of profilePictures) {
        await prisma.profilePicture.create({
            data: picture,
        });
    }

    console.log('Profile pictures seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
