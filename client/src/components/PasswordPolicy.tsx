import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordPolicyProps {
  password?: string;
  email?: string;
}

const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', '123456789', 
  '1234567890', 'qwerty', 'qwertyuiop', 'admin', 'admin123'
];

export const PasswordPolicy: React.FC<PasswordPolicyProps> = ({ password = '', email = '' }) => {
  if (!password && !email) {
    return null; // Don't show if empty initially, or we can show it with neutral state
  }

  // Rules evaluation
  // If password is empty, state is neutral (null), otherwise true/false
  const hasStarted = password.length > 0;
  
  const rules = [
    {
      text: 'contains at least 12 characters',
      isValid: hasStarted ? password.length >= 12 : null
    },
    {
      text: 'contains both lower (a-z) and upper case letters (A-Z)',
      isValid: hasStarted ? (/[a-z]/.test(password) && /[A-Z]/.test(password)) : null
    },
    {
      text: 'contains at least one number (0-9) or a symbol',
      isValid: hasStarted ? (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) : null
    },
    {
      text: 'does not contain your email address',
      isValid: hasStarted ? (email ? !password.toLowerCase().includes(email.split('@')[0].toLowerCase()) : true) : null
    },
    {
      text: 'is not commonly used',
      isValid: hasStarted ? (!COMMON_PASSWORDS.some(cp => password.toLowerCase().includes(cp))) : null
    }
  ];

  return (
    <div className="mt-2 text-sm text-gray-300 bg-white/5 border border-white/10 p-3 rounded-xl">
      <p className="font-medium mb-2">Create a password that:</p>
      <ul className="space-y-1.5">
        {rules.map((rule, idx) => {
          let Icon = () => <span className="w-4 h-4 inline-flex items-center justify-center text-gray-500 text-[10px]">•</span>;
          let textColor = "text-gray-400";
          
          if (rule.isValid === true) {
            Icon = () => <Check className="w-3.5 h-3.5 text-green-500" />;
            textColor = "text-green-500";
          } else if (rule.isValid === false) {
            Icon = () => <X className="w-3.5 h-3.5 text-red-500" />;
            textColor = "text-red-500";
          }

          return (
            <li key={idx} className={`flex items-center gap-2 ${textColor}`}>
              <Icon />
              <span>{rule.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
