import { useMemo } from 'react';

interface PasswordStrengthBarProps {
  password: string;
  className?: string;
}

export function PasswordStrengthBar({ password, className = '' }: PasswordStrengthBarProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;
    
    // Contains numbers
    if (/\d/.test(password)) score++;
    
    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Determine strength
    if (score <= 2) {
      return { score: 1, label: 'Weak', color: '#ef4444' }; // red
    } else if (score <= 4) {
      return { score: 2, label: 'Medium', color: '#f59e0b' }; // orange
    } else {
      return { score: 3, label: 'Strong', color: '#22c55e' }; // green
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full bg-muted transition-all duration-300"
            style={{
              backgroundColor: level <= strength.score ? strength.color : undefined,
            }}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-sm" style={{ color: strength.color }}>
          Password strength: {strength.label}
        </p>
      )}
    </div>
  );
}
