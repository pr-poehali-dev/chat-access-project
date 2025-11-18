import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Message } from './types';

interface ChatMessageInputProps {
  newMessage: string;
  isLoading: boolean;
  replyingTo: Message | null;
  imagePreviews: string[];
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: (index: number) => void;
  onClearAllImages: () => void;
  onTyping?: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function ChatMessageInput({
  newMessage,
  isLoading,
  replyingTo,
  imagePreviews,
  onMessageChange,
  onSend,
  onCancelReply,
  onImageSelect,
  onClearImage,
  onClearAllImages,
  onTyping,
  fileInputRef
}: ChatMessageInputProps) {
  return (
    <>
      {imagePreviews.length > 0 && (
        <Card className="p-3 bg-secondary/10 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Изображения ({imagePreviews.length})</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearAllImages}
              className="h-6 px-2 gap-1"
            >
              <Icon name="X" size={12} />
              <span className="text-xs">Очистить все</span>
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={preview} 
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => onClearImage(idx)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {replyingTo && (
        <Card className="p-3 bg-secondary/10 border-secondary/30">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Reply" size={14} className="text-secondary" />
                <span className="text-xs font-medium text-secondary">Ответ на сообщение</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{replyingTo.content}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <Icon name="X" size={14} />
            </Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => {
            onMessageChange(e.target.value);
            onTyping?.();
          }}
          placeholder="Введите сообщение..."
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onImageSelect}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 p-0"
            title="Прикрепить изображение"
          >
            <Icon name="Image" size={16} />
          </Button>
          <Button
            onClick={onSend}
            disabled={isLoading || (!newMessage.trim() && imagePreviews.length === 0)}
            className="h-10 w-10 p-0"
          >
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}
