"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../styles/groups.module.css';
import { CreatePost } from '../../posts/create_post';
import { PostFeed } from '../../posts/PostFeed';

export default function GroupDetailPage() {
    const router = useRouter();
    const params = useParams();
    const groupId = params.id;

    const [group, setGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsers, setInviteUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        event_date: ''
    });

    const fetchGroupDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch(`http://localhost:8080/api/groups/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('isLoggedIn');
                    router.replace('/login');
                    return;
                }
                if (response.status === 403) {
                    setError('You are not a member of this group');
                    return;
                }
                throw new Error('Failed to fetch group details');
            }

            const data = await response.json();
            setGroup(data.group);
        } catch (error) {
            console.error('Error fetching group details:', error);
            setError('Failed to load group details. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/groups/${groupId}/requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/groups/events?group_id=${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleInviteUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups/invite', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    group_id: parseInt(groupId),
                    user_ids: selectedUsers.map(user => user.id)
                }),
                credentials: 'include'
            });

            if (response.ok) {
                setShowInviteModal(false);
                setSelectedUsers([]);
                setSearchQuery('');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error inviting users:', error);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/groups/invite?group_id=${groupId}&search=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleRequestAction = async (memberId, action) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups/request', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    member_id: memberId,
                    action: action
                }),
                credentials: 'include'
            });

            if (response.ok) {
                fetchPendingRequests();
            }
        } catch (error) {
            console.error('Error handling request:', error);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    group_id: parseInt(groupId),
                    ...eventForm
                }),
                credentials: 'include'
            });

            if (response.ok) {
                setShowCreateEvent(false);
                setEventForm({ title: '', description: '', event_date: '' });
                fetchEvents();
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleEventResponse = async (eventId, response) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:8080/api/groups/events/response', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: eventId,
                    response: response
                }),
                credentials: 'include'
            });

            fetchEvents();
        } catch (error) {
            console.error('Error responding to event:', error);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchGroupDetails();
            fetchPendingRequests();
            fetchEvents();
        }
    }, [groupId]);

    useEffect(() => {
        if (searchQuery) {
            const timeoutId = setTimeout(searchUsers, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading group details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error}
                    <button onClick={() => router.push('/groups')} className={styles.retryButton}>
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Group not found</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.groupHeader}>
                <div>
                    <h1>{group.title}</h1>
                    <p className={styles.description}>{group.description}</p>
                    <span className={styles.meta}>Created: {group.created_at}</span>
                </div>
                <div className={styles.groupActions}>
                    {(group.status === 'creator' || group.status === 'approved') && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className={styles.inviteButton}
                        >
                            Invite Members
                        </button>
                    )}
                </div>
            </div>

            {/* pending Requests for Creator */}
            {group.status === 'creator' && pendingRequests.length > 0 && (
                <div className={styles.pendingRequests}>
                    <h3>Pending Join Requests</h3>
                    {pendingRequests.map(request => (
                        <div key={request.id} className={styles.requestItem}>
                            <span>{request.username}</span>
                            <div className={styles.requestActions}>
                                <button
                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                    className={styles.approveButton}
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                    className={styles.rejectButton}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Posts
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    Events
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'invite' ? styles.active : ''}`}
                    onClick={() => setActiveTab('invite')}
                >
                    Members
                </button>
            </div>

            {/* posts Tab */}
            {activeTab === 'posts' && (
                <div className={styles.tabContent}>
                    <CreatePost onPostCreated={() => { }} groupId={groupId} />
                    <PostFeed groupId={groupId} />
                </div>
            )}

            {/* events Tab */}
            {activeTab === 'events' && (
                <div className={styles.tabContent}>
                    <div className={styles.eventsHeader}>
                        <h3>Group Events</h3>
                        <button
                            onClick={() => setShowCreateEvent(true)}
                            className={styles.createEventButton}
                        >
                            Create Event
                        </button>
                    </div>

                    {showCreateEvent && (
                        <div className={styles.createEventForm}>
                            <h4>Create New Event</h4>
                            <form onSubmit={handleCreateEvent}>
                                <div className={styles.formGroup}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={eventForm.title}
                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={eventForm.event_date}
                                        onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="submit" className={styles.submitButton}>
                                        Create Event
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateEvent(false)}
                                        className={styles.cancelButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.eventsList}>
                        {events.map(event => (
                            <div key={event.id} className={styles.eventCard}>
                                <div className={styles.eventHeader}>
                                    <h4>{event.title}</h4>
                                    <span className={styles.eventDate}>
                                        {new Date(event.event_date).toLocaleString()}
                                    </span>
                                </div>
                                <p>{event.description}</p>
                                <div className={styles.eventStats}>
                                    <span>Going: {event.going_count}</span>
                                    <span>Not Going: {event.not_going_count}</span>
                                </div>
                                <div className={styles.eventActions}>
                                    <button
                                        onClick={() => handleEventResponse(event.id, 'going')}
                                        className={styles.goingButton}
                                    >
                                        Going
                                    </button>
                                    <button
                                        onClick={() => handleEventResponse(event.id, 'not_going')}
                                        className={styles.notGoingButton}
                                    >
                                        Not Going
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Tab */}
            {activeTab === 'invite' && (
                <div className={styles.tabContent}>
                    <div className={styles.eventsHeader}>
                        <h3>Group Members</h3>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className={styles.createEventButton}
                        >
                            invite Members
                        </button>
                    </div>
                    {showInviteModal && (
                        <div className={styles.modal}>
                            <div className={styles.modalContent}>
                                <div className={styles.searchBox}>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button onClick={searchUsers} className={styles.searchButton}>
                                        Search
                                    </button>
                                </div>
                                <div className={styles.usersList}>
                                    {searchResults.map(user => (
                                        <div key={user.id} className={styles.userItem}>
                                            <span>{user.first_name} {user.last_name}</span>
                                            <button
                                                onClick={() => {
                                                    if (!selectedUsers.find(u => u.id === user.id)) {
                                                        setSelectedUsers([...selectedUsers, user]);
                                                    }
                                                }}
                                                className={styles.addButton}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.selectedUsers}>
                                    <h4>Selected Users:</h4>
                                    {selectedUsers.map(user => (
                                        <div key={user.id} className={styles.selectedUser}>
                                            <span>{user.first_name} {user.last_name}</span>
                                            <button
                                                onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                                                className={styles.removeButton}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.modalActions}>
                                    <button
                                        onClick={handleInviteUsers}
                                        className={styles.submitButton}
                                        disabled={selectedUsers.length === 0}
                                    >
                                        Send Invitations ({selectedUsers.length})
                                    </button>
                                    <button onClick={() => {
                                        setShowInviteModal(false);
                                        setSelectedUsers([]);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }} className={styles.cancelButton}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>)}
        </div>
    );
} 