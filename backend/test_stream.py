import os
from stream_chat import StreamChat

# Your credentials
api_key = "d6f5rvrn4fqn"
api_secret = "h8vxsnwugcn4yqf2v6ht9m2t5usrzv6uhcypwe4dweyeeshrmb6usckh6bntn9nb"

print("1. Initializing Stream Chat client...")
client = StreamChat(api_key=api_key, api_secret=api_secret)
print("✅ Client initialized")

# Test user creation
test_user = "test-user-123"
other_user = "other-user-456"
print(f"\n2. Creating users: {test_user} and {other_user}")

# Use upsert_users (plural) which is the current method
client.upsert_users([
    {
        "id": test_user,
        "name": "Test User",
        "role": "user"
    },
    {
        "id": other_user,
        "name": "Other User",
        "role": "user"
    }
])
print("✅ Users created")

# Test token generation
print(f"\n3. Generating token for {test_user}")
token = client.create_token(test_user)
print(f"✅ Token: {token[:50]}...")

# Test channel creation
channel_id = "test-channel-123"
print(f"\n4. Creating channel: {channel_id}")

# Create channel with members - DON'T set created_by_id, it's set by the create() call
channel = client.channel("messaging", channel_id, {
    "name": "Test Channel",
    "members": [test_user, other_user],
    # Remove created_by_id from here
})

# Pass the user_id who is creating the channel - this sets the creator
response = channel.create(test_user)
print(f"✅ Channel created: {response['channel']['id']}")

print("\n🎉 All Stream Chat operations successful!")
