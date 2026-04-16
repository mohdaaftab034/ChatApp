import { UserPlus, Mail, Share2, Smartphone } from 'lucide-react'

export function AddContactSection() {
  return (
    <div className="hidden md:flex flex-1 min-w-0 h-full bg-page relative flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <UserPlus size={40} className="text-accent" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Add New Contact</h2>
          <p className="text-text-secondary leading-relaxed">
            Expand your network by adding new contacts. Enter their information to stay connected and collaborate with colleagues, friends, and team members.
          </p>
        </div>

        {/* Primary Action */}
        <button className="w-full bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
          Add Contact
        </button>

        {/* Help Section */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-tertiary mb-4">You can also add contacts by:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email invitation</p>
                <p className="text-xs text-text-tertiary">Send an email to invite someone</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share2 size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Share link</p>
                <p className="text-xs text-text-tertiary">Share your profile link to connect</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone number</p>
                <p className="text-xs text-text-tertiary">Find contacts using their phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
