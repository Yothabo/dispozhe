@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info(f"WebSocket connection attempt from {client_host} for session {session_id}")

    db = SessionLocal()
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()

        if not session:
            logger.warning(f"Session {session_id} not found")
            await websocket.close(code=1008, reason="Session not found")
            return

        logger.info(f"Session {session_id} found, status: {session.status}")

        if session.status == "expired" or session.status == "terminated" or datetime.utcnow() > session.expires_at:
            logger.warning(f"Session {session_id} expired")
            await websocket.close(code=1008, reason="Session expired")
            return

        # Check connection count BEFORE accepting
        current_connections = app.state.manager.get_connection_count(session_id)
        if current_connections >= 2:
            logger.warning(f"Session {session_id} already has 2 connections - rejecting with code 4003")
            await websocket.close(code=4003, reason="Session full")
            return

        # Now accept the connection
        await websocket.accept()
        logger.info(f"WebSocket accepted for session {session_id}")

        # Register the connection
        await app.state.manager.connect(websocket, session_id)

        connection_count = app.state.manager.get_connection_count(session_id)
        logger.info(f"WebSocket connected for session {session_id}, total connections: {connection_count}")

        # Send connected message
        time_left = session.time_left() if hasattr(session, 'time_left') else 300
        await websocket.send_text(json.dumps({
            "type": "connected",
            "session_id": session_id,
            "participant_count": session.participant_count,
            "connection_count": connection_count,
            "time_left": time_left,
            "timestamp": datetime.utcnow().isoformat()
        }))

        # Heartbeat to keep connection alive
        async def heartbeat():
            try:
                while True:
                    await asyncio.sleep(25)
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            except:
                pass

        heartbeat_task = asyncio.create_task(heartbeat())

        try:
            while True:
                message = await websocket.receive_text()
                logger.debug(f"Received message from {session_id}: {message[:50]}")

                # Broadcast to other participants
                await app.state.manager.broadcast_to_session(
                    session_id,
                    message,
                    exclude=websocket
                )
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {session_id}")
            app.state.manager.disconnect(websocket, session_id)
        except Exception as e:
            logger.error(f"WebSocket error for session {session_id}: {e}")
            app.state.manager.disconnect(websocket, session_id)
        finally:
            heartbeat_task.cancel()

    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}")
        logger.error(traceback.format_exc())
    finally:
        db.close()
