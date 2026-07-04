import { NextResponse } from 'next/server';

const BOT_TOKEN = '8797394555:AAECLgx3ZmP4E96O6548zfsPBcR7pC4M1Xs';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axor.fun';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update.message;
    
    if (!message) return NextResponse.json({ ok: true });
    
    const chatId = message.chat.id;
    const text = message.text || '';
    
    if (text === '/start') {
      await sendMessage(chatId, 
        `🚀 *Axor Support Bot*\n\n` +
        `Welcome to Axor! Here's what you can do:\n\n` +
        `🎯 *Commands*\n` +
        `• /token - Create a meme coin\n` +
        `• /boost - Boost your token\n` +
        `• /referral - Get referral code\n` +
        `• /help - Show this menu\n\n` +
        `📱 *Quick Links*\n` +
        `• Create Token: ${SITE_URL}/create\n` +
        `• New Pairs: ${SITE_URL}/new-pairs\n` +
        `• Referral: ${SITE_URL}/referral\n\n` +
        `💬 Need help? Type your question here!`
      );
    }
    else if (text === '/token') {
      await sendMessage(chatId, 
        `✨ *Create Your Meme Coin*\n\n` +
        `Launch your token on Solana in seconds!\n\n` +
        `✅ 0.008 SOL only\n` +
        `✅ 3 revokes (Mint, Freeze, Update)\n` +
        `✅ IPFS metadata\n\n` +
        `👉 [Start Creating](${SITE_URL}/create)`
      );
    }
    else if (text === '/boost') {
      await sendMessage(chatId, 
        `🚀 *Boost Your Token*\n\n` +
        `Get featured in the global banner for 4 days!\n\n` +
        `💰 0.1 SOL\n` +
        `👁️ Increased visibility\n` +
        `🎯 More discoverability\n\n` +
        `👉 [Boost Now](${SITE_URL}/create)`
      );
    }
    else if (text === '/referral') {
      await sendMessage(chatId, 
        `💰 *Referral Program*\n\n` +
        `Earn 0.05 SOL for every friend who creates a token!\n\n` +
        `📊 Milestone bonuses:\n` +
        `• 10 referrals → +0.1 SOL\n` +
        `• 25 referrals → +0.2 SOL\n` +
        `• 50 referrals → +0.5 SOL\n` +
        `• 100 referrals → +1 SOL\n\n` +
        `👉 [View Dashboard](${SITE_URL}/referral)`
      );
    }
    else if (text === '/help') {
      await sendMessage(chatId, 
        `📖 *Help Menu*\n\n` +
        `Available commands:\n` +
        `/start - Welcome message\n` +
        `/token - Create a token\n` +
        `/boost - Boost your token\n` +
        `/referral - Referral program\n` +
        `/help - This menu\n\n` +
        `🔗 Useful links:\n` +
        `• Website: ${SITE_URL}\n` +
        `• Twitter: https://x.com/AxorFun`
      );
    }
    else {
      await sendMessage(chatId, 
        `🤖 Hello! Type /help to see available commands.\n\n` +
        `📢 Join our community: @Axor_Official`
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false });
  }
}

async function sendMessage(chatId: number, text: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text, 
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  });
  return response.json();
}

export async function GET() {
  return NextResponse.json({ message: 'Telegram bot webhook is running' });
}