"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/groups.module.css';

export default function GroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', description: '' });
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const fetchGroups = async (loadMore = false) => {
        if (loadMore) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const currentOffset = loadMore ? offset : 0;
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`http://localhost:8080/api/groups?offset=${currentOffset}${searchParam}`, {
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
                throw new Error('Failed to fetch groups');
            }

            const data = await response.json();
            const newGroups = data.groups || [];
            
            if (loadMore) {
                setGroups(prevGroups => [...prevGroups, ...newGroups]);
                setOffset(prevOffset => prevOffset + 10);
            } else {
                setGroups(newGroups);
                setOffset(10);
            }
            
            setHasMore(newGroups.length === 10);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setError('Failed to load groups. Please try again later.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        
        if (!createForm.title.trim() || !createForm.description.trim()) {
            setError('Title and description are required');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createForm),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create group');
            }

            const data = await response.json();
            setShowCreateForm(false);
            setCreateForm({ title: '', description: '' });
            fetchGroups(); // Refresh the groups list
        } catch (error) {
            setError(error.message);
        }
    };

    const handleJoinGroup = async (groupID) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ group_id: groupID }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send join request');
            }

            // Update the group status in the list
            setGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === groupID
                        ? { ...group, status: 'pending' }
                        : group
                )
            );
        } catch (error) {
            setError(error.message);
        }
    };

    const handleInvitationResponse = async (groupID, action) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/groups/invitation/response', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    group_id: groupID, 
                    action: action 
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${action} invitation`);
            }

            // Update the group status in the list
            setGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === groupID
                        ? { ...group, status: action === 'accept' ? 'approved' : '' }
                        : group
                )
            );
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        setOffset(0);
        await fetchGroups();
        setIsSearching(false);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'creator':
                return 'Creator';
            case 'approved':
                return 'Member';
            case 'pending':
                return 'Request Pending';
            case 'invited':
                return 'Invited';
            default:
                return 'Not a Member';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'creator':
                return styles.creator;
            case 'approved':
                return styles.member;
            case 'pending':
                return styles.pending;
            case 'invited':
                return styles.invited;
            default:
                return styles.notMember;
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [router]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading groups...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error}
                    <button onClick={() => fetchGroups()} className={styles.retryButton}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Groups</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className={styles.createButton}
                >
                    {showCreateForm ? 'Cancel' : 'Create Group'}
                </button>
            </div>

            {/* Search Section */}
            <div className={styles.searchSection}>
                <div className={styles.searchInput}>
                    <input
                        type="text"
                        placeholder="Search groups by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        className={styles.searchButton}
                        disabled={isSearching}
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {searchQuery && (
                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            fetchGroups();
                        }}
                        className={styles.clearSearchButton}
                    >
                        Clear Search
                    </button>
                )}
            </div>

            {showCreateForm && (
                <div className={styles.createForm}>
                    <h2>Create New Group</h2>
                    <form onSubmit={handleCreateGroup}>
                        <div className={styles.formGroup}>
                            <label htmlFor="title">Group Title</label>
                            <input
                                type="text"
                                id="title"
                                value={createForm.title}
                                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                placeholder="Enter group title"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                placeholder="Enter group description"
                                required
                            />
                        </div>
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.submitButton}>
                                Create Group
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.groupsList}>
                {groups.length > 0 ? (
                    groups.map(group => (
                        <div key={group.id} className={styles.groupCard}>
                            <div className={styles.groupHeader}>
                                <h3>{group.title}</h3>
                                <span className={`${styles.status} ${getStatusClass(group.status)}`}>
                                    {getStatusText(group.status)}
                                </span>
                            </div>
                            <p className={styles.description}>{group.description}</p>
                            <div className={styles.groupMeta}>
                                <span>Created: {group.created_at}</span>
                            </div>
                            <div className={styles.groupActions}>
                                {group.status === '' && (
                                    <button
                                        onClick={() => handleJoinGroup(group.id)}
                                        className={styles.joinButton}
                                    >
                                        Request to Join
                                    </button>
                                )}
                                {group.status === 'invited' && (
                                    <div className={styles.invitationActions}>
                                        <button
                                            onClick={() => handleInvitationResponse(group.id, 'accept')}
                                            className={styles.acceptButton}
                                        >
                                            Accept Invitation
                                        </button>
                                        <button
                                            onClick={() => handleInvitationResponse(group.id, 'reject')}
                                            className={styles.rejectButton}
                                        >
                                            Reject Invitation
                                        </button>
                                    </div>
                                )}
                                {(group.status === 'approved' || group.status === 'creator') && (
                                    <button
                                        onClick={() => router.push(`/groups/${group.id}`)}
                                        className={styles.viewButton}
                                    >
                                        View Group
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyMessage}>
                        {searchQuery ? 'No groups found matching your search.' : 'No groups found. Create a group to get started!'}
                    </div>
                )}
            </div>

            {isLoadingMore && (
                <div className={styles.loadingMore}>
                    Loading more groups...
                </div>
            )}
        </div>
    );
}
