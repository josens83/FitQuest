import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Level Avatar - Avatar with level indicator
interface LevelAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  level: number;
  src?: string;
  fallback: string;
}

const LevelAvatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, LevelAvatarProps>(
  ({ className, level, src, fallback, ...props }, ref) => (
    <div className="relative">
      <Avatar ref={ref} className={cn('ring-2 ring-primary/50', className)} {...props}>
        <AvatarImage src={src} alt={fallback} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
        {level}
      </div>
    </div>
  )
);
LevelAvatar.displayName = 'LevelAvatar';

export { Avatar, AvatarImage, AvatarFallback, LevelAvatar };
