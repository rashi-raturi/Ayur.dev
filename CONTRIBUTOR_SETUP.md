# 🏥 HIS Integration - Contributor Setup Guide

## 🚀 Quick Start for Contributors

The HIS (Hospital Information System) integration is ready to use immediately! All contributors can access the shared MongoDB Atlas database.

### ✅ **Automatic Setup (Recommended)**

The HIS database uses the same MongoDB Atlas cluster as the main application:

```bash
# 1. Clone and install
git clone <repository-url>
cd backend && npm install

# 2. The .env file already contains connection strings
# Both main database and HIS database work automatically!

# 3. Seed HIS database with sample patients (one-time)
node seedHISSimple.js

# 4. Start the server
npm start
```

### 🔧 **Manual Environment Setup (Optional)**

If you prefer environment variables, add to your `.env`:

```env
# HIS Database Configuration
HIS_MONGODB_URI=mongodb+srv://jaynab:jaynab.food@cluster0.sn4jwl9.mongodb.net/hospital_his_system
```

### 📊 **Database Structure**

- **Main Database**: `prescripto` (patients, appointments, prescriptions)
- **HIS Database**: `hospital_his_system` (HIS patients, diet chart requests)
- **Connection**: Same MongoDB Atlas cluster, different databases

### 🌐 **Database Access Details**

- **Cluster**: MongoDB Atlas (Cloud)
- **Access**: Shared credentials (all contributors)
- **Seeded Data**: 10 sample HIS patients with medical histories
- **Sync**: Bidirectional sync between main system and HIS

### 🔄 **HIS Integration Features**

1. **Patient Search**: Search and import patients from HIS
2. **Auto-fill**: Populate patient forms with HIS data
3. **Diet Chart Sync**: Automatically sync diet charts to HIS
4. **Real-time Stats**: Monitor integration status and metrics

### ✨ **Demo Data Available**

The HIS database comes pre-seeded with:

- 10 diverse patient profiles
- Medical histories and constitutions
- Chronic conditions and allergies
- Contact information and demographics

### 🎯 **For Smart India Hackathon Demo**

This setup demonstrates:

- **"Integration Potential"** with hospital systems
- Real-time bidirectional data sync
- Professional healthcare data management
- Scalable cloud architecture

## 🤝 **Contributing**

1. All HIS features work out of the box
2. No additional database setup required
3. Same development workflow as main app
4. Test HIS integration using the built-in UI

**Ready to use immediately after `git clone`!** 🚀
