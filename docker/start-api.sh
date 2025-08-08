#!/bin/sh

echo "🔄 Running database migrations..."
npm run prisma:push

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
    echo "🚀 Starting API server..."
    exec npm run start:server
else
    echo "❌ Database migrations failed"
    exit 1
fi
