import { WelcomeEmailTemplate } from '@/components/email/templates/WelcomeEmail';
import { PasswordResetEmailTemplate } from '@/components/email/templates/PasswordResetEmail';
import { EmailVerificationTemplate } from '@/components/email/templates/EmailVerification';
import { supabase } from '@/lib/supabase';

export interface EmailTemplateData {
  welcome: {
    userName?: string;
  };
  passwordReset: {
    resetLink: string;
    userName?: string;
    expiresIn?: string;
  };
  verification: {
    verificationLink: string;
    userName?: string;
    expiresIn?: string;
  };
  petFound: {
    petName: string;
    matchConfidence: number;
    location: string;
    reporterName: string;
    petImage?: string;
  };
  weeklyDigest: {
    userName?: string;
    newPetsFound: number;
    successfulReunions: number;
    activeSearches: number;
    volunteerHours: number;
  };
}

export class EmailTemplateService {
  static async sendWelcomeEmail(email: string, data: EmailTemplateData['welcome']) {
    const htmlContent = WelcomeEmailTemplate(data.userName);
    
    return await this.sendEmail(email, '🎉 Welcome to SAR Buddy - Your Pet Recovery Journey Begins!', htmlContent);
  }

  static async sendPasswordResetEmail(email: string, data: EmailTemplateData['passwordReset']) {
    const htmlContent = PasswordResetEmailTemplate(data.resetLink, data.userName, data.expiresIn);
    
    return await this.sendEmail(email, '🔐 Reset Your Password - SAR Buddy', htmlContent);
  }

  static async sendVerificationEmail(email: string, data: EmailTemplateData['verification']) {
    const htmlContent = EmailVerificationTemplate(data.verificationLink, data.userName, data.expiresIn);
    
    return await this.sendEmail(email, '✅ Verify Your Email - SAR Buddy', htmlContent);
  }

  static async sendPetFoundAlert(email: string, data: EmailTemplateData['petFound']) {
    const htmlContent = this.getPetFoundTemplate(data);
    
    return await this.sendEmail(email, `🐾 Great News! Potential Match Found for ${data.petName}`, htmlContent);
  }

  static async sendWeeklyDigest(email: string, data: EmailTemplateData['weeklyDigest']) {
    const htmlContent = this.getWeeklyDigestTemplate(data);
    
    return await this.sendEmail(email, '📊 Your Weekly SAR Buddy Update', htmlContent);
  }

  private static async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: htmlContent
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }

  private static getPetFoundTemplate(data: EmailTemplateData['petFound']): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pet Match Found - SAR Buddy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
              <div style="display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.2); border-radius: 100px; margin-bottom: 16px;">
                <span style="font-size: 32px;">🎉</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Great News!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px;">We found a potential match for ${data.petName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 8px 20px; background: #dcfce7; border-radius: 100px;">
                  <span style="color: #14532d; font-size: 24px; font-weight: 700;">${data.matchConfidence}% Match</span>
                </div>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 16px 0;">Match Details:</h3>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Location:</strong> ${data.location}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Reported by:</strong> ${data.reporterName}</p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://iszecjqkufweyplfabmz.supabase.co/matches" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600;">
                  View Match Details
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 24px;">
                Please review this match as soon as possible. The reporter is waiting for your response.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f7fafc; padding: 28px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #718096; font-size: 14px; margin: 0;">
                © 2024 SAR Buddy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private static getWeeklyDigestTemplate(data: EmailTemplateData['weeklyDigest']): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Update - SAR Buddy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">📊 Weekly Update</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0;">Your SAR Buddy Community Impact</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #1a202c; margin: 0 0 24px 0;">Hi ${data.userName || 'there'}!</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
                Here's what happened in your SAR Buddy community this week:
              </p>
              
              <div style="display: table; width: 100%; margin: 24px 0;">
                <div style="display: table-cell; width: 50%; padding: 16px; text-align: center;">
                  <div style="font-size: 36px; color: #667eea; font-weight: 700;">${data.newPetsFound}</div>
                  <div style="color: #6b7280; margin-top: 8px;">New Pets Found</div>
                </div>
                <div style="display: table-cell; width: 50%; padding: 16px; text-align: center;">
                  <div style="font-size: 36px; color: #10b981; font-weight: 700;">${data.successfulReunions}</div>
                  <div style="color: #6b7280; margin-top: 8px;">Successful Reunions</div>
                </div>
              </div>
              
              <div style="display: table; width: 100%; margin: 24px 0;">
                <div style="display: table-cell; width: 50%; padding: 16px; text-align: center;">
                  <div style="font-size: 36px; color: #f59e0b; font-weight: 700;">${data.activeSearches}</div>
                  <div style="color: #6b7280; margin-top: 8px;">Active Searches</div>
                </div>
                <div style="display: table-cell; width: 50%; padding: 16px; text-align: center;">
                  <div style="font-size: 36px; color: #8b5cf6; font-weight: 700;">${data.volunteerHours}</div>
                  <div style="color: #6b7280; margin-top: 8px;">Volunteer Hours</div>
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://iszecjqkufweyplfabmz.supabase.co/dashboard" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600;">
                  View Full Dashboard
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #f7fafc; padding: 28px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #718096; font-size: 14px; margin: 0;">
                Thank you for being part of the SAR Buddy community!<br>
                © 2024 SAR Buddy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}