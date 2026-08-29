const rawReply = ` tags.
* The user is greeting me casually.
<reply>Привет! Как дела?`;
const match = rawReply.match(/<reply>\s*([\s\S]*?)(?:<\/reply>|$)/i);
console.log('MATCH:', match ? match[1].trim() : 'NO MATCH');
