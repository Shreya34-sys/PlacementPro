// seedAdmins.js
//for adding new admin comment out all the code below and then then writing details of only new admin,add new admin and run cmd node seedAdmins.js





// const bcrypt = require('bcryptjs');
// const User = require('./models/userModel');

// async function seed() {
//     try {
//         const pass1 = await bcrypt.hash('sharma@123', 10);
//         const pass2 = await bcrypt.hash('patil@123', 10);

//         await User.createAdmin({
//             fullName: 'Prof. Sharma',
//             email: 'sharma@gmail.com',
//             password: pass1,
//             designation: 'Head TPO',
//             department: 'Computer Science'
//         });

//         await User.createAdmin({
//             fullName: 'Prof. Patil',
//             email: 'patil@gmail.com',
//             password: pass2,
//             designation: 'Assistant TPO',
//             department: 'Information Technology'
//         });

//         console.log('Admins seeded successfully!');
//         process.exit(0);
//     } catch (err) {
//         console.error('Seeding failed:', err);
//         process.exit(1);
//     }
// }

// seed();






// // seedAdmins.js (Updated for a 3rd admin)
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

async function seed() {
    try {
        const pass3 = await bcrypt.hash('pproadmin@123', 10);

        await User.createAdmin({
            fullName: 'Prof. pproadmin',
            email: 'pproadmin@gmail.com',
            password: pass3,
            designation: 'Placement Coordinator',
            department: 'csbs'
        });

        console.log('New admin added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Adding admin failed:', err);
        process.exit(1);
    }
}

seed();