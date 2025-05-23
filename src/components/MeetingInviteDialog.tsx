import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Copy, Send, Loader2, AlertTriangle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
interface MeetingInviteDialogProps {
  meetingTime: string;
  date: string;
}
export const MeetingInviteDialog = ({
  meetingTime,
  date
}: MeetingInviteDialogProps) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [open, setOpen] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Retrieve stored Resend API key when component mounts
    const storedApiKey = localStorage.getItem('resend_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);
  const generateGoogleMeetLink = () => {
    const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
    setMeetingLink(meetLink);
    toast({
      description: "Google Meet link generated successfully!",
      duration: 2000
    });
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink).then(() => {
      toast({
        description: "Meeting link copied to clipboard!",
        duration: 2000
      });
    });
  };
  const handleSendInvite = async () => {
    // Form validation
    if (!senderName || !senderEmail || !recipientEmails || !description || !meetingLink) {
      toast({
        variant: "destructive",
        description: "Please fill in all required fields",
        duration: 3000
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      toast({
        variant: "destructive",
        description: "Please enter a valid sender email address",
        duration: 3000
      });
      return;
    }

    // Validate recipient emails (comma separated)
    const recipients = recipientEmails.split(',').map(email => email.trim());
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast({
        variant: "destructive",
        description: `Invalid recipient email(s): ${invalidEmails.join(', ')}`,
        duration: 3000
      });
      return;
    }

    // Check for API key
    const resendApiKey = apiKey || localStorage.getItem('resend_api_key');
    if (!resendApiKey) {
      toast({
        variant: "destructive",
        description: "Please set your Resend API key in Settings first",
        duration: 3000
      });
      return;
    }
    setIsSending(true);
    try {
      // Format the current date correctly
      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Send email to each recipient
      for (const recipientEmail of recipients) {
        const emailContent = `
          <div style="font-family: sans-serif;">
            <p>Hello,</p>
            <p>You have been invited to a meeting by ${senderName} (${senderEmail}).</p>
            <p><strong>Meeting Details:</strong></p>
            <p>Date: ${formattedDate}</p>
            <p>Time: ${meetingTime}</p>
            <p>Meeting Link: <a href="${meetingLink}">${meetingLink}</a></p>
            <p><strong>Message:</strong></p>
            <p>${description.replace(/\n/g, '<br/>')}</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">Sent via Tyme!</p>
          </div>
        `;
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'noreply@tymeai.com',
              to: recipientEmail,
              subject: 'Meeting Invite',
              html: emailContent
            })
          });
          const data = await response.json().catch(() => null);
          if (!response.ok) {
            console.error('API response:', data);
            throw new Error(`Failed to send email: ${data?.error?.message || response.statusText}`);
          }
          console.log('Email sent successfully:', data);
        } catch (error) {
          console.error('Email sending error:', error);
          throw error; // Re-throw to be caught by outer catch block
        }
      }

      // Success handling
      toast({
        description: "✅ Invitation sent successfully!",
        duration: 3000
      });

      // Reset form and close dialog
      setSenderName('');
      setSenderEmail('');
      setRecipientEmails('');
      setDescription('');
      setMeetingLink('');
      setOpen(false);
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        variant: "destructive",
        description: `Failed to send invitation: ${error.message || 'Please try again'}`,
        duration: 5000
      });
    } finally {
      setIsSending(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 md:ml-4 mx-[4px] md:mx-[8px] hover:bg-gradient-to-r hover:from-[#FFD93B] hover:via-[#FF4E9B] hover:to-[#2AC4F2]">
          <Mail className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Send Invite</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] h-[90vh] bg-black/90 text-white border border-white/10 overflow-y-auto mx-2">
        
        
        <div className="relative -mt-2 -mx-6 mb-0 py-0">
          <img alt="Meeting Banner" className="w-full h-[120px] md:h-[200px] object-cover" src="/lovable-uploads/018f957d-6791-4e60-8334-7c2b7ca353d4.png" />
        </div>

        {!apiKey && !localStorage.getItem('resend_api_key') && <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-md p-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              Please add your Resend API key in the Settings panel before sending invites.
            </p>
          </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sender-name">Your Name *</Label>
            <Input id="sender-name" value={senderName} onChange={e => setSenderName(e.target.value)} className="bg-black/50 border-white/20 text-white" disabled={isSending} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sender-email">Your Email *</Label>
            <Input id="sender-email" type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="bg-black/50 border-white/20 text-white" disabled={isSending} />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="recipient-emails">Recipient Emails * (comma separated)</Label>
          <Input id="recipient-emails" value={recipientEmails} onChange={e => setRecipientEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" className="bg-black/50 border-white/20 text-white" disabled={isSending} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="meeting-link">Meeting Link *</Label>
          <div className="flex gap-2">
            <Input id="meeting-link" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="Your meeting link will appear here" className="bg-black/50 border-white/20 flex-1 bg-gradient-to-r from-[#FFD93B] via-[#FF4E9B] to-[#2AC4F2] bg-clip-text text-transparent" readOnly disabled={isSending} />
            <Button variant="outline" size="icon" onClick={handleCopyLink} disabled={isSending || !meetingLink} className="hover:bg-gradient-to-r hover:from-[#FFD93B] hover:via-[#FF4E9B] hover:to-[#2AC4F2]">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={generateGoogleMeetLink} disabled={isSending} className="hover:bg-gradient-to-r hover:from-[#FFD93B] hover:via-[#FF4E9B] hover:to-[#2AC4F2]">
              Generate Meet Link
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Meeting Description *</Label>
          <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="bg-black/50 border-white/20 text-white min-h-[150px]" placeholder="Enter meeting agenda and details..." disabled={isSending} />
        </div>

        <div className="text-sm text-white mt-2">
          <p className="flex flex-wrap gap-2">
            <span>Meeting Time:</span>
            <span className="text-white/90">{meetingTime}</span>
          </p>
          <p className="flex flex-wrap gap-2">
            <span>Date:</span>
            <span className="text-white/90">{date}</span>
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSendInvite} disabled={isSending} className="flex-1 text-white bg-gradient-to-r from-[#FFD93B] via-[#FF4E9B] to-[#2AC4F2] hover:opacity-90 transition-all duration-300">
            {isSending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </> : <>
                <Send className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Send Invitation</span>
                <span className="sm:hidden">Send</span>
              </>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};