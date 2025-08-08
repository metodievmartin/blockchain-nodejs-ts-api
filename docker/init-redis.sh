#!/bin/sh

# Install gettext package which provides envsubst
apk add --no-cache gettext

# Only generate ACL if it doesn't exist
if [ ! -f /usr/local/etc/redis/users.acl ]; then
    echo "🔄 Generating Redis ACL file with user: $REDIS_USER"
    envsubst < /usr/local/etc/redis/users.acl.template > /usr/local/etc/redis/users.acl
    echo "✅ Generated ACL file:"
    cat /usr/local/etc/redis/users.acl
else
    echo "ℹ️  ACL file already exists, skipping generation"
fi

# Start Redis with the generated ACL file
echo "🚀 Starting Redis server..."
exec redis-server /usr/local/etc/redis/redis.conf
