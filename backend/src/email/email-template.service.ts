/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { EMAIL_TYPES } from '../common/constants';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailTemplateService {
  getTemplate(type: string, data: any): EmailTemplate {
    switch (type) {
      case EMAIL_TYPES.WELCOME:
        return this.getWelcomeTemplate(data);
      case EMAIL_TYPES.PARCEL_STATUS_UPDATE:
        return this.getParcelStatusUpdateTemplate(data);
      case EMAIL_TYPES.PARCEL_DELIVERED:
        return this.getParcelDeliveredTemplate(data);
      case EMAIL_TYPES.PASSWORD_RESET:
        return this.getPasswordResetTemplate(data);
      case EMAIL_TYPES.NEW_PARCEL_REQUEST:
        return this.getNewParcelRequestTemplate(data);
      case EMAIL_TYPES.PARCEL_REQUEST_STATUS_UPDATE:
        return this.getParcelRequestStatusUpdateTemplate(data);
      case EMAIL_TYPES.NEW_USER_CREDENTIALS:
        return this.getNewUserCredentialsTemplate(data);
      case EMAIL_TYPES.CONTACT_MESSAGE_REPLY:
        return this.getContactMessageReplyTemplate(data);
      case 'parcel_request_rejected':
        return this.getParcelRequestRejectedTemplate(data);
      default:
        throw new Error(`Template type ${type} not found`);
    }
  }

  private getContactMessageReplyTemplate(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    reply: string;
  }): EmailTemplate {
    const html = `
      <table style="width:100%;font-family:sans-serif;background:#f8fafc;padding:32px 0">
        <tr>
          <td align="center">
            <table style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px #e0e7ef;padding:32px">
              <tr>
                <td style="text-align:center;padding-bottom:24px">
                  <h2 style="color:#2563eb;font-size:28px;margin:0 0 8px">Reply to Your Contact Message</h2>
                  <p style="color:#374151;font-size:16px;margin:0">Hi ${data.name},</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:16px">
                  <p style="color:#374151;font-size:16px;margin:0">Thank you for reaching out to us. Here is our reply to your message:</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:16px">
                  <strong>Subject:</strong> ${data.subject}<br>
                  <strong>Your Message:</strong> ${data.message}<br>
                  <strong>Our Reply:</strong> <span style="color:#2563eb">${data.reply}</span>
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px">
                  <p style="color:#374151;font-size:15px;margin:0">If you have further questions, feel free to reply to this email or contact us again.</p>
                  <p style="color:#2563eb;font-size:15px;margin:16px 0 0">Best regards,<br>Plink Logistics Team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
    const text = `
      Reply to Your Contact Message\n\nHi ${data.name},\n\nThank you for reaching out to us. Here is our reply to your message:\n\nSubject: ${data.subject}\nYour Message: ${data.message}\nOur Reply: ${data.reply}\n\nIf you have further questions, feel free to reply to this email or contact us again.\n\nBest regards,\nPlink Logistics Team\n`;
    return {
      subject: 'Reply to Your Contact Message',
      html,
      text,
    };
  }

  private getWelcomeTemplate(data: {
    firstName: string;
    lastName: string;
    email: string;
    verificationCode?: string;
  }): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0;">Welcome to Plink Logistics Courier Service!</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Hello ${data.firstName} ${data.lastName}!</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Welcome to Plink, your trusted courier service partner. We're excited to have you on board!
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            With Plink, you can:
          </p>
          
          <ul style="color: #555; line-height: 1.8;">
            <li>Send and receive parcels securely</li>
            <li>Track your deliveries in real-time</li>
            <li>Get instant notifications on parcel status updates</li>
            <li>View detailed delivery information with Google Maps integration</li>
          </ul>
          
          <p style="color: #555; line-height: 1.6;">
            Your account is now active and ready to use. Start sending your first parcel today!
          </p>
          
          ${
            data.verificationCode
              ? `
            <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:24px 0;text-align:center;">
              <p style="color:#2563eb;font-size:20px;font-weight:bold;">Your Email Verification Code:</p>
              <p style="font-size:32px;letter-spacing:8px;color:#2563eb;font-weight:bold;">${data.verificationCode}</p>
              <p style="color:#555;font-size:15px;">This code is valid for 1 hour.</p>
            </div>
          `
              : ''
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Thank you for choosing Plink Logistics Courier Service<br>
            Need help? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      Welcome to Plink Logistics Courier Service!
      
      Hello ${data.firstName} ${data.lastName}!
      
      Welcome to Plink, your trusted courier service partner. We're excited to have you on board!
      
      With Plink, you can:
      • Send and receive parcels securely
      • Track your deliveries in real-time
      • Get instant notifications on parcel status updates
      • View detailed delivery information with Google Maps integration
      
      Your account is now active and ready to use. Start sending your first parcel today!
      
      Thank you for choosing Plink Logistics Courier Service
      Need help? Contact us at support@plinklogistics.com
    `;

    return {
      subject: 'Welcome to Plink Logistics Courier Service!',
      html,
      text,
    };
  }

  private getPasswordResetTemplate(data: {
    resetToken: string;
    firstName: string;
    lastName: string;
    email: string;
  }): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f39c12; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Hello ${data.firstName} ${data.lastName},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password for your account associated with this email address.
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #555; font-size: 16px; margin-bottom: 10px;">Your Password Reset Code:</p>
            <p style="color: #e74c3c; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px;">${data.resetToken}</p>
          </div>

          <p style="color: #555; line-height: 1.6;">
            Please use this code to reset your password. The code will expire in 15 minutes.
          </p>

          <p style="color: #555; line-height: 1.6;">
            If you didn't request this change, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Secure & Reliable<br>
            Need help? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      Password Reset Request
      
      Hello ${data.firstName} ${data.lastName},
      
      We received a request to reset your password for your account associated with this email address.
      
      Your Password Reset Code: ${data.resetToken}
      
      Please use this code to reset your password. The code will expire in 15 minutes.
      
      If you didn't request this change, please ignore this email.
    `;

    return {
      subject: 'Password Reset Code - Plink Logistics',
      html,
      text,
    };
  }

  private getParcelStatusUpdateTemplate(data: any): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0;">Parcel Status Update</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Your parcel status has been updated!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Parcel Details</h3>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">${data.status}</span></p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Current Location:</strong> ${data.currentLocation}</p>
            <p><strong>From:</strong> ${data.pickupLocation}</p>
            <p><strong>To:</strong> ${data.destinationLocation}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Your parcel is on its way! We'll continue to keep you updated on its progress.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Track Your Parcel
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Reliable Delivery, Every Time<br>
            Questions? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      Parcel Status Update
      
      Your parcel status has been updated!
      
      Parcel Details:
      Tracking Number: ${data.trackingNumber}
      Status: ${data.status}
      Description: ${data.description}
      Currrent Location: ${data.currentLocation}
      From: ${data.pickupLocation}
      To: ${data.destinationLocation}
      
      Your parcel is on its way! We'll continue to keep you updated on its progress.

      Plink Logistics Courier Service - Reliable Delivery, Every Time
      Questions? Contact us at support@plinklogistics.com
    `;

    return {
      subject: `Parcel Status Update - ${data.trackingNumber}`,
      html,
      text,
    };
  }

  private getParcelDeliveredTemplate(data: any): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #27ae60; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Parcel Delivered Successfully!</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Great news! Your parcel has been delivered.</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Delivery Details</h3>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">DELIVERED</span></p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Delivered To:</strong> ${data.destinationLocation}</p>
            <p><strong>Delivered On:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you for choosing Plink Logistics Courier Service. We hope you're satisfied with our service!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Rate Our Service
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Delivered with Care<br>
            Thank you for your business! Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      🎉 Parcel Delivered Successfully!
      
      Great news! Your parcel has been delivered.
      
      Delivery Details:
      Tracking Number: ${data.trackingNumber}
      Status: DELIVERED
      Description: ${data.description}
      Delivered To: ${data.destinationLocation}
      Delivered On: ${new Date().toLocaleString()}

      Thank you for choosing Plink Logistics Courier Service. We hope you're satisfied with our service!

      Plink Logistics Courier Service - Delivered with Care
      Thank you for your business! Contact us at support@plinklogistics.com
    `;

    return {
      subject: `🎉 Parcel Delivered - ${data.trackingNumber}`,
      html,
      text,
    };
  }

  private getNewParcelRequestTemplate(data: any): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3498db; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📦 New Parcel Request</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">New parcel request awaiting review</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
            <p><strong>Request ID:</strong> ${data.id}</p>
            <p><strong>From:</strong> ${data.sender.firstName} ${data.sender.lastName} (${data.sender.email})</p>
            <p><strong>To:</strong> ${data.receiverEmail}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Weight:</strong> ${data.weight} kg</p>
            <p><strong>Pickup:</strong> ${data.pickupLocation}</p>
            <p><strong>Destination:</strong> ${data.destinationLocation}</p>
            ${data.requestedPickupDate ? `<p><strong>Requested Pickup Date:</strong> ${new Date(data.requestedPickupDate).toLocaleDateString()}</p>` : ''}
            ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Please review this request and update its status in the admin panel.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Request
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Admin Notification<br>
            This is an automated notification for administrators
          </p>
        </div>
      </div>
    `;

    const text = `
      📦 New Parcel Request
      
      New parcel request awaiting review
      
      Request Details:
      Request ID: ${data.id}
      From: ${data.sender.firstName} ${data.sender.lastName} (${data.sender.email})
      To: ${data.receiverEmail}
      Description: ${data.description}
      Weight: ${data.weight} kg
      Pickup: ${data.pickupLocation}
      Destination: ${data.destinationLocation}
      ${data.requestedPickupDate ? `Requested Pickup Date: ${new Date(data.requestedPickupDate).toLocaleDateString()}` : ''}
      ${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}` : ''}
      
      Please review this request and update its status in the admin panel.

      Plink Logistics Courier Service - Admin Notification
      This is an automated notification for administrators
    `;

    return {
      subject: `New Parcel Request - ${data.id}`,
      html,
      text,
    };
  }

  private getParcelRequestStatusUpdateTemplate(data: any): EmailTemplate {
    const statusColor =
      data.status === 'APPROVED'
        ? '#27ae60'
        : data.status === 'REJECTED'
          ? '#e74c3c'
          : '#f39c12';
    const statusIcon =
      data.status === 'APPROVED'
        ? '✅'
        : data.status === 'REJECTED'
          ? '❌'
          : '⏳';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${statusColor}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${statusIcon} Parcel Request ${data.status}</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Hello ${data.sender.firstName} ${data.sender.lastName},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Your parcel request has been <strong style="color: ${statusColor};">${data.status.toLowerCase()}</strong>.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
            <p><strong>Request ID:</strong> ${data.id}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Weight:</strong> ${data.weight} kg</p>
            <p><strong>From:</strong> ${data.pickupLocation}</p>
            <p><strong>To:</strong> ${data.destinationLocation}</p>
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${data.status}</span></p>
            ${data.adminNotes ? `<p><strong>Admin Notes:</strong> ${data.adminNotes}</p>` : ''}
          </div>
          
          ${
            data.status === 'APPROVED'
              ? '<p style="color: #555; line-height: 1.6;">Great news! Your request has been approved. An admin will create your parcel shortly and you\'ll receive tracking information.</p>'
              : data.status === 'REJECTED'
                ? '<p style="color: #555; line-height: 1.6;">Unfortunately, your request has been rejected. Please check the admin notes above for more information.</p>'
                : '<p style="color: #555; line-height: 1.6;">Your request is being reviewed. We\'ll update you once a decision has been made.</p>'
          }
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Request Details
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Request Update<br>
            Questions? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      ${statusIcon} Parcel Request ${data.status}
      
      Hello ${data.sender.firstName} ${data.sender.lastName},
      
      Your parcel request has been ${data.status.toLowerCase()}.
      
      Request Details:
      Request ID: ${data.id}
      Description: ${data.description}
      Weight: ${data.weight} kg
      From: ${data.pickupLocation}
      To: ${data.destinationLocation}
      Status: ${data.status}
      ${data.adminNotes ? `Admin Notes: ${data.adminNotes}` : ''}
      
      ${
        data.status === 'APPROVED'
          ? "Great news! Your request has been approved. An admin will create your parcel shortly and you'll receive tracking information."
          : data.status === 'REJECTED'
            ? 'Unfortunately, your request has been rejected. Please check the admin notes above for more information.'
            : "Your request is being reviewed. We'll update you once a decision has been made."
      }
      
      Plink Logistics Courier Service - Request Update
      Questions? Contact us at support@plinklogistics.com
    `;

    return {
      subject: `Parcel Request ${data.status} - ${data.id}`,
      html,
      text,
    };
  }

  private getNewUserCredentialsTemplate(data: {
    firstName: string;
    lastName: string;
    email: string;
    tempPassword: string;
    expiryDate: string;
  }): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3498db; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔑 Welcome to Plink Logistics - Your Account is Ready!</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Hello ${data.firstName} ${data.lastName},</h2>
          
          <p style="color: #555; line-height: 1.6;">
            A parcel has been sent to you through Plink Logistics Courier Service. We've created an account for you so you can track your parcel and use our services.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Login Credentials</h3>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Temporary Password:</strong> <span style="color: #e74c3c; font-weight: bold; font-family: monospace; background-color: #f1f2f6; padding: 4px 8px; border-radius: 4px;">${data.tempPassword}</span></p>
            <p style="color: #e67e22; font-weight: bold;">⚠️ This password expires on: ${data.expiryDate}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-weight: bold;">Important Security Notice:</p>
            <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">
              Please log in and change your password within 24 hours. Your temporary password will expire after this time for security reasons.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Once you log in, you'll be able to:
          </p>
          
          <ul style="color: #555; line-height: 1.8;">
            <li>Track your incoming parcel in real-time</li>
            <li>View detailed delivery information</li>
            <li>Send parcels to others</li>
            <li>Manage your account settings</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
        </div>
        
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Secure & Reliable<br>
            Need help? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;

    const text = `
      🔑 Welcome to Plink Logistics - Your Account is Ready!

      Hello ${data.firstName} ${data.lastName},

      A parcel has been sent to you through Plink Logistics Courier Service. We've created an account for you so you can track your parcel and use our services.

      Your Login Credentials:
      Email: ${data.email}
      Temporary Password: ${data.tempPassword}
      ⚠️ This password expires on: ${data.expiryDate}
      
      Important Security Notice:
      Please log in and change your password within 24 hours. Your temporary password will expire after this time for security reasons.
      
      Once you log in, you'll be able to:
      • Track your incoming parcel in real-time
      • View detailed delivery information
      • Send parcels to others
      • Manage your account settings

      Plink Logistics Courier Service - Secure & Reliable
      Need help? Contact us at support@plinklogistics.com
    `;

    return {
      subject: 'Welcome to Plink Logistics - Your Account Credentials',
      html,
      text,
    };
  }

  private getParcelRequestRejectedTemplate(data: {
    senderName: string;
    receiverEmail: string;
    description: string;
    weight: number;
    pickupLocation: string;
    destinationLocation: string;
    adminNotes?: string;
  }): EmailTemplate {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e74c3c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">❌ Parcel Request Rejected</h1>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e;">Hello ${data.senderName},</h2>
          <p style="color: #555; line-height: 1.6;">
            Unfortunately, your parcel request has been <strong style="color: #e74c3c;">rejected</strong>.
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
            <p><strong>To:</strong> ${data.receiverEmail}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Weight:</strong> ${data.weight} kg</p>
            <p><strong>Pickup:</strong> ${data.pickupLocation}</p>
            <p><strong>Destination:</strong> ${data.destinationLocation}</p>
            ${data.adminNotes ? `<p><strong>Admin Notes:</strong> ${data.adminNotes}</p>` : ''}
          </div>
          <p style="color: #555; line-height: 1.6;">
            Please review the notes above and contact support if you have questions.
          </p>
        </div>
        <div style="background-color: #34495e; color: white; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            Plink Logistics Courier Service - Request Update<br>
            Questions? Contact us at support@plinklogistics.com
          </p>
        </div>
      </div>
    `;
    const text = `
      Parcel Request Rejected

      Hello ${data.senderName},

      Unfortunately, your parcel request has been rejected.

      Request Details:
      To: ${data.receiverEmail}
      Description: ${data.description}
      Weight: ${data.weight} kg
      Pickup: ${data.pickupLocation}
      Destination: ${data.destinationLocation}
      ${data.adminNotes ? `Admin Notes: ${data.adminNotes}` : ''}

      Please review the notes above and contact support if you have questions.

      Plink Logistics Courier Service - Request Update
      Questions? Contact us at support@plinklogistics.com
    `;
    return {
      subject: 'Parcel Request Rejected',
      html,
      text,
    };
  }
}
