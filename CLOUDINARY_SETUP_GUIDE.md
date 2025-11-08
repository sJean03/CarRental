# Cloudinary Setup Guide for RentEase

This guide will help you set up Cloudinary for driver's license photo uploads in the registration flow.

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service. We use it to securely store driver's license photos uploaded during user registration.

## Step-by-Step Setup

### 1. Create a Free Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" (free tier is sufficient for development)
3. Fill in your details and create an account
4. Verify your email address

### 2. Get Your Cloud Name

1. Log in to your Cloudinary dashboard
2. You'll see your **Cloud Name** on the dashboard homepage
3. It looks something like: `dxxxxxxxxxxxxxx` or `your-company-name`
4. Copy this value - you'll need it later

### 3. Create an Upload Preset

An upload preset defines how files should be uploaded and stored.

1. In the Cloudinary dashboard, click **Settings** (gear icon in the top right)
2. Go to the **Upload** tab
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: Choose a name (e.g., `rentease_licenses`)
   - **Signing Mode**: Select **Unsigned** (this allows uploads directly from the browser)
   - **Folder**: Enter `rentease/licenses` (organizes uploads)
   - **Use filename**: Toggle ON if you want to preserve original filenames
   - Leave other settings as default
6. Click **Save**
7. Copy the **Preset name** you just created

### 4. Configure Your Application

1. Navigate to your project's frontend directory:
   ```bash
   cd /Users/a10021204/Documents/Career/Personal/CarRental/frontend
   ```

2. Create a `.env.local` file (if it doesn't exist):
   ```bash
   cp .env.local.example .env.local
   ```

3. Open `.env.local` and add your Cloudinary credentials:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=rentease_licenses
   ```

4. Replace `your_cloud_name_here` with your actual Cloud Name from step 2

### 5. Test the Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the registration page: `http://localhost:3000/register`

3. Try uploading a test image:
   - Use a JPG, JPEG, or PNG file
   - Maximum file size: 5MB
   - The upload should show a progress bar
   - After upload, you'll see a green success message with a thumbnail

### 6. Verify Upload in Cloudinary

1. Go back to your Cloudinary dashboard
2. Click on **Media Library** in the left sidebar
3. Navigate to the `rentease/licenses` folder
4. You should see your uploaded test image

## Cloudinary Free Tier Limits

The free tier includes:
- **25 GB** storage
- **25 GB** monthly bandwidth
- **25,000** transformations per month

This is more than sufficient for development and small-scale production use.

## Security Best Practices

1. **Never commit `.env.local` to Git** - it's already in `.gitignore`
2. **Use separate upload presets** for development and production
3. **Enable folder organization** to keep uploads organized
4. **Set up moderation** in production to review uploaded licenses

## Troubleshooting

### Error: "Cloudinary credentials not configured"

**Solution**: Make sure `.env.local` exists and contains the correct values. Restart your dev server after adding environment variables.

### Error: "Upload failed"

**Possible causes**:
1. File is too large (>5MB)
2. File type not supported (only JPG, JPEG, PNG allowed)
3. Invalid upload preset name
4. Network issues

**Solution**:
- Check file size and type
- Verify upload preset is set to "Unsigned"
- Check browser console for detailed error messages

### Uploads work locally but not in production

**Solution**: Make sure to add the environment variables to your production environment (Vercel, Netlify, etc.)

## Advanced Configuration (Optional)

### Enable Image Transformations

Cloudinary can automatically resize and optimize images:

1. In your upload preset settings:
   - **Incoming Transformation**: Add transformations like:
     - `c_limit,w_1200,h_1200,q_auto` (resize to max 1200x1200, auto quality)
     - `f_auto` (auto format conversion)

### Set Up Webhooks

Get notified when uploads complete:

1. Go to **Settings → Webhooks**
2. Add a webhook URL for upload notifications
3. Use this to trigger additional processing or verification

## Need Help?

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Contact Support](https://support.cloudinary.com)

## Summary

After completing this setup:
- ✅ Driver's license photos upload directly from browser to Cloudinary
- ✅ Images are securely stored in the cloud
- ✅ URLs are saved to your database
- ✅ No backend file handling needed
- ✅ Free tier is sufficient for development

Your registration form will now support secure driver's license photo uploads!
