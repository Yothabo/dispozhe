import React from 'react';
import { FaUserFriends, FaUsers, FaChalkboardTeacher, FaBroadcastTower, FaFileDownload, FaCommentSlash } from 'react-icons/fa';

const ModesContent: React.FC = () => {
  return (
    <div className="text-grey space-y-8">
      <div className="text-center mb-4">
        <p className="text-sm leading-relaxed max-w-2xl mx-auto">
          Six ways to communicate privately. Each mode is ephemeral, encrypted, and anonymous by design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaUserFriends className="text-sky text-xl" />
            <h4 className="text-white font-bold">Duo</h4>
          </div>
          <p className="text-sm text-grey mb-3">Private two-person ephemeral chats.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• One-time access</li>
            <li>• Auto or manual destruction</li>
            <li>• End-to-end encrypted</li>
            <li>• Optional per-message timers</li>
          </ul>
        </div>

        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaUsers className="text-sky text-xl" />
            <h4 className="text-white font-bold">Group</h4>
          </div>
          <p className="text-sm text-grey mb-3">Small multi-participant sessions.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• Anonymous handles</li>
            <li>• Configurable participant caps</li>
            <li>• Temporary moderator roles</li>
            <li>• Read-only observer mode</li>
          </ul>
        </div>

        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaChalkboardTeacher className="text-sky text-xl" />
            <h4 className="text-white font-bold">Live Board</h4>
          </div>
          <p className="text-sm text-grey mb-3">Classroom and meeting engagement.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• Host creates room with display code</li>
            <li>• Anonymous participant messages</li>
            <li>• Message queue on host screen</li>
            <li>• Pin, approve, or answer questions</li>
          </ul>
        </div>

        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaBroadcastTower className="text-sky text-xl" />
            <h4 className="text-white font-bold">Broadcast</h4>
          </div>
          <p className="text-sm text-grey mb-3">One-to-many ephemeral announcements.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• Host-only messaging</li>
            <li>• Anonymous participant reactions</li>
            <li>• Auto-clear after stream ends</li>
          </ul>
        </div>

        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaFileDownload className="text-sky text-xl" />
            <h4 className="text-white font-bold">Drop</h4>
          </div>
          <p className="text-sm text-grey mb-3">Ephemeral file and text transfer.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• Self-destructs when opened</li>
            <li>• For sensitive documents</li>
            <li>• No server retention</li>
          </ul>
        </div>

        <div className="glass rounded-xl p-5 border border-sky/10">
          <div className="flex items-center gap-3 mb-3">
            <FaCommentSlash className="text-sky text-xl" />
            <h4 className="text-white font-bold">Whisper</h4>
          </div>
          <p className="text-sm text-grey mb-3">Micro-messages that disappear seconds after reading.</p>
          <ul className="space-y-1 text-xs text-grey/70">
            <li>• No logs</li>
            <li>• No identity</li>
            <li>• Configurable read timers</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-grey/50 text-center pt-4">
        Ephemeral by design. Anonymous by default.
      </p>
    </div>
  );
};

export default ModesContent;
