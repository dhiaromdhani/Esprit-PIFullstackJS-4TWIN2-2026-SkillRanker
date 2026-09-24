const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Employee model
const Employee = require('./models/Employee');

async function importEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital');
    console.log('Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '../machine learning/Ml-service/employee_dataset_1000.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV (simple parsing)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const employees = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));

      if (values.length >= headers.length) {
        // Parse skills from the skills column (index 4)
        const skillsString = values[4] || '';
        const skills = skillsString ? skillsString.split(', ').map(skill => ({
          name: skill.trim(),
          level: 1 // Default level
        })) : [];

        const employee = {
          firstName: values[1], // firstName
          lastName: values[2],  // lastName
          email: `${values[1].toLowerCase()}.${values[2].toLowerCase()}@company.com`,
          jobTitle: values[3],  // jobTitle
          department: 'IT',     // Default department
          skills: skills
        };

        employees.push(employee);
      }
    }

    console.log(`Parsed ${employees.length} employees from CSV`);

    // Clear existing employees
    await Employee.deleteMany({});
    console.log('Cleared existing employees');

    // Insert new employees
    const insertedEmployees = await Employee.insertMany(employees);
    console.log(`Successfully imported ${insertedEmployees.length} employees`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error importing employees:', error);
    process.exit(1);
  }
}

importEmployees();