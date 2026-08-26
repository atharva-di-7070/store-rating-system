import {useEffect, useState} from 'react'
import './App.css'

const API = 'http://localhost:5000/api'

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  )
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  )
  const [page, setPage] = useState('dashboard')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken('')
    setUser(null)
    setPage('dashboard')
  }

  if (!token || !user) {
    return (
      <AuthPage
        setToken={setToken}
        setUser={setUser}
      />
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          ⭐ Store Rating
        </div>

        <div className="nav-right">
          <span>
            {user.name}
          </span>

          <span className="role">
            {user.role}
          </span>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-container">
        {user.role === 'USER' && (
          <UserDashboard
            token={token}
            page={page}
            setPage={setPage}
            user={user}
          />
        )}

        {user.role === 'ADMIN' && (
          <AdminDashboard
            token={token}
            page={page}
            setPage={setPage}
          />
        )}

        {user.role === 'STORE_OWNER' && (
          <OwnerDashboard
            token={token}
            page={page}
            setPage={setPage}
          />
        )}
      </main>
    </div>
  )
}

// =====================================================
// AUTH
// =====================================================

function AuthPage({setToken, setUser}) {
  const [mode, setMode] = useState('login')

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = e => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const submit = async e => {
    e.preventDefault()

    setMessage('')
    setError('')
    setLoading(true)

    try {
      const endpoint =
        mode === 'login'
          ? '/auth/login'
          : '/auth/register'

      const body =
        mode === 'login'
          ? {
              email: form.email,
              password: form.password,
            }
          : form

      const response = await fetch(
        API + endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Request failed'
        )
      }

      if (mode === 'register') {
        setMessage(
          'Registration successful. Please login.'
        )

        setMode('login')

        setForm({
          name: '',
          email: form.email,
          address: '',
          password: '',
        })
      } else {
        localStorage.setItem(
          'token',
          data.token
        )

        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        )

        setToken(data.token)
        setUser(data.user)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          ⭐
        </div>

        <h1>Store Rating System</h1>

        <p className="subtitle">
          {mode === 'login'
            ? 'Sign in to your account'
            : 'Create your account'}
        </p>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert success">
            {message}
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>Name</label>

              <input
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Enter your full name"
                required
              />

              <label>Address</label>

              <textarea
                name="address"
                value={form.address}
                onChange={update}
                placeholder="Enter your address"
                required
              />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update}
            placeholder="Enter email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={update}
            placeholder="Enter password"
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Login'
              : 'Register'}
          </button>
        </form>

        <button
          className="switch-btn"
          onClick={() => {
            setMode(
              mode === 'login'
                ? 'register'
                : 'login'
            )
            setError('')
            setMessage('')
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  )
}

// =====================================================
// USER DASHBOARD
// =====================================================

function UserDashboard({
  token,
  page,
  setPage,
}) {
  if (page === 'password') {
    return (
      <PasswordPage
        token={token}
        role="USER"
        setPage={setPage}
      />
    )
  }

  return (
    <UserStores
      token={token}
      setPage={setPage}
    />
  )
}

function UserStores({
  token,
  setPage,
}) {
  const [stores, setStores] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStores = async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `${API}/user/stores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load stores'
        )
      }

      setStores(data.stores || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const filtered = stores.filter(store => {
    const text = search.toLowerCase()

    return (
      store.name
        ?.toLowerCase()
        .includes(text) ||
      store.email
        ?.toLowerCase()
        .includes(text) ||
      store.address
        ?.toLowerCase()
        .includes(text)
    )
  })

  return (
    <>
      <Sidebar
        items={[
          {
            label: 'Stores',
            value: 'dashboard',
          },
          {
            label: 'Change Password',
            value: 'password',
          },
        ]}
        active="dashboard"
        setPage={setPage}
      />

      <section className="content">
        <div className="page-header">
          <div>
            <h1>Stores</h1>
            <p>
              Search stores and submit your rating.
            </p>
          </div>

          <input
            className="search"
            placeholder="Search stores..."
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
          />
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            Loading stores...
          </div>
        ) : (
          <div className="store-grid">
            {filtered.map(store => (
              <StoreCard
                key={store.id}
                store={store}
                token={token}
                reload={loadStores}
              />
            ))}

            {filtered.length === 0 && (
              <div className="empty">
                No stores found.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}

function StoreCard({
  store,
  token,
  reload,
}) {
  const [rating, setRating] = useState(
    store.userSubmittedRating || 0
  )

  const [message, setMessage] = useState('')

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      setMessage(
        'Please select a rating from 1 to 5.'
      )
      return
    }

    try {
      const alreadyRated =
        store.userSubmittedRating

      const response = await fetch(
        `${API}/user/stores/${store.id}/rating`,
        {
          method: alreadyRated
            ? 'PUT'
            : 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: Number(rating),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Rating failed'
        )
      }

      setMessage(
        alreadyRated
          ? 'Rating updated successfully'
          : 'Rating submitted successfully'
      )

      reload()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="store-card">
      <div className="store-icon">
        🏪
      </div>

      <h3>{store.name}</h3>

      <p>{store.email}</p>

      <p>{store.address}</p>

      <div className="rating-summary">
        <strong>
          ⭐ {store.overallRating ?? 0}
        </strong>

        <span>
          Overall Rating
        </span>
      </div>

      <div className="rating-box">
        <p>
          {store.userSubmittedRating
            ? `Your rating: ${store.userSubmittedRating}`
            : 'Rate this store'}
        </p>

        <div className="stars">
          {[1, 2, 3, 4, 5].map(number => (
            <button
              key={number}
              className={
                number <= rating
                  ? 'star active'
                  : 'star'
              }
              onClick={() =>
                setRating(number)
              }
            >
              ★
            </button>
          ))}
        </div>

        <button
          className="primary-btn small"
          onClick={submitRating}
        >
          {store.userSubmittedRating
            ? 'Update Rating'
            : 'Submit Rating'}
        </button>

        {message && (
          <small>{message}</small>
        )}
      </div>
    </div>
  )
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

function AdminDashboard({
  token,
  page,
  setPage,
}) {
  if (page === 'users') {
    return (
      <>
        <Sidebar
          active="users"
          setPage={setPage}
          items={[
            {
              label: 'Dashboard',
              value: 'dashboard',
            },
            {
              label: 'Users',
              value: 'users',
            },
            {
              label: 'Stores',
              value: 'stores',
            },
            {
              label: 'Change Password',
              value: 'password',
            },
          ]}
        />

        <AdminUsers
          token={token}
          setPage={setPage}
        />
      </>
    )
  }

  if (page === 'stores') {
    return (
      <>
        <Sidebar
          active="stores"
          setPage={setPage}
          items={[
            {
              label: 'Dashboard',
              value: 'dashboard',
            },
            {
              label: 'Users',
              value: 'users',
            },
            {
              label: 'Stores',
              value: 'stores',
            },
            {
              label: 'Change Password',
              value: 'password',
            },
          ]}
        />

        <AdminStores
          token={token}
          setPage={setPage}
        />
      </>
    )
  }

  if (page === 'password') {
    return (
      <PasswordPage
        token={token}
        role="ADMIN"
        setPage={setPage}
      />
    )
  }

  return (
    <>
      <Sidebar
        active="dashboard"
        setPage={setPage}
        items={[
          {
            label: 'Dashboard',
            value: 'dashboard',
          },
          {
            label: 'Users',
            value: 'users',
          },
          {
            label: 'Stores',
            value: 'stores',
          },
          {
            label: 'Change Password',
            value: 'password',
          },
        ]}
      />

      <AdminHome token={token} />
    </>
  )
}

function AdminHome({token}) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`${API}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <section className="content">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Manage users, stores and ratings.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat
          title="Total Users"
          value={data?.totalUsers ?? '-'}
          icon="👥"
        />

        <Stat
          title="Total Stores"
          value={data?.totalStores ?? '-'}
          icon="🏪"
        />

        <Stat
          title="Total Ratings"
          value={data?.totalRatings ?? '-'}
          icon="⭐"
        />
      </div>
    </section>
  )
}

function AdminUsers({
  token,
  setPage,
}) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const loadUsers = async () => {
    const params = new URLSearchParams()

    if (search) {
      params.set('name', search)
    }

    if (role) {
      params.set('role', role)
    }

    const response = await fetch(
      `${API}/admin/users?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    setUsers(data.users || [])
  }

  useEffect(() => {
    loadUsers()
  }, [search, role])

  return (
    <section className="content">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage all registered users.</p>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Search by name"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
        />

        <select
          value={role}
          onChange={e =>
            setRole(e.target.value)
          }
        >
          <option value="">
            All Roles
          </option>
          <option value="USER">
            USER
          </option>
          <option value="ADMIN">
            ADMIN
          </option>
          <option value="STORE_OWNER">
            STORE OWNER
          </option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Role</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.address}</td>
                <td>
                  <span className="badge">
                    {user.role}
                  </span>
                </td>
                <td>
                  <button
                    className="outline-btn"
                    onClick={() =>
                      setPage(
                        `user-${user.id}`
                      )
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.map(user =>
        setPage &&
        null
      )}
    </section>
  )
}

function AdminStores({
  token,
  setPage,
}) {
  const [stores, setStores] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')

  const loadStores = async () => {
    const params = new URLSearchParams()

    if (search) {
      params.set('name', search)
    }

    params.set('sortBy', sort)

    const response = await fetch(
      `${API}/admin/stores?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    setStores(data.stores || [])
  }

  useEffect(() => {
    loadStores()
  }, [search, sort])

  return (
    <section className="content">
      <div className="page-header">
        <div>
          <h1>Stores</h1>
          <p>Manage all stores.</p>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Search store name"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
        />

        <select
          value={sort}
          onChange={e =>
            setSort(e.target.value)
          }
        >
          <option value="name">
            Sort by Name
          </option>

          <option value="email">
            Sort by Email
          </option>

          <option value="address">
            Sort by Address
          </option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Store</th>
              <th>Email</th>
              <th>Address</th>
              <th>Rating</th>
            </tr>
          </thead>

          <tbody>
            {stores.map(store => (
              <tr key={store.id}>
                <td>{store.id}</td>
                <td>{store.name}</td>
                <td>{store.email}</td>
                <td>{store.address}</td>
                <td>
                  ⭐ {store.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// =====================================================
// STORE OWNER
// =====================================================

function OwnerDashboard({
  token,
  page,
  setPage,
}) {
  if (page === 'password') {
    return (
      <PasswordPage
        token={token}
        role="STORE_OWNER"
        setPage={setPage}
      />
    )
  }

  return (
    <>
      <Sidebar
        active="dashboard"
        setPage={setPage}
        items={[
          {
            label: 'Dashboard',
            value: 'dashboard',
          },
          {
            label: 'Change Password',
            value: 'password',
          },
        ]}
      />

      <section className="content">
        <OwnerHome token={token} />
      </section>
    </>
  )
}

function OwnerHome({token}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/store-owner/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async response => {
        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.message ||
              'Failed to load dashboard'
          )
        }

        return result
      })
      .then(setData)
      .catch(err =>
        setError(err.message)
      )
  }, [])

  if (error) {
    return (
      <div className="alert error">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Store Owner Dashboard</h1>
          <p>
            View your store ratings and customers.
          </p>
        </div>
      </div>

      {data?.stores?.map(store => (
        <div
          className="owner-card"
          key={store.store?.id}
        >
          <h2>
            {store.store?.name}
          </h2>

          <p>
            {store.store?.email}
          </p>

          <p>
            {store.store?.address}
          </p>

          <div className="stats-grid">
            <Stat
              title="Average Rating"
              value={
                store.averageRating ?? 0
              }
              icon="⭐"
            />

            <Stat
              title="Total Ratings"
              value={
                store.totalRatings ?? 0
              }
              icon="📊"
            />
          </div>

          <h3>
            Customer Ratings
          </h3>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Rating</th>
                </tr>
              </thead>

              <tbody>
                {store.users?.map(item => (
                  <tr
                    key={item.ratingId}
                  >
                    <td>
                      {item.user?.name}
                    </td>

                    <td>
                      {item.user?.email}
                    </td>

                    <td>
                      ⭐ {item.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  )
}

// =====================================================
// PASSWORD
// =====================================================

function PasswordPage({
  token,
  role,
  setPage,
}) {
  const [currentPassword, setCurrentPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const submit = async e => {
    e.preventDefault()

    setMessage('')
    setError('')

    try {
      let endpoint = ''

      if (role === 'ADMIN') {
        endpoint = '/admin/password'
      } else if (role === 'STORE_OWNER') {
        endpoint = '/store-owner/password'
      } else {
        endpoint = '/user/password'
      }

      const response = await fetch(
        API + endpoint,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Password update failed'
        )
      }

      setMessage(
        'Password updated successfully.'
      )

      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Sidebar
        active="password"
        setPage={setPage}
        items={[
          {
            label: 'Dashboard',
            value: 'dashboard',
          },
          {
            label: 'Change Password',
            value: 'password',
          },
        ]}
      />

      <section className="content">
        <div className="form-card">
          <h1>Change Password</h1>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          <form onSubmit={submit}>
            <label>
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={e =>
                setCurrentPassword(
                  e.target.value
                )
              }
              required
            />

            <label>
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={e =>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="8-16 chars, uppercase + special"
              required
            />

            <button className="primary-btn">
              Update Password
            </button>
          </form>
        </div>
      </section>
    </>
  )
}

// =====================================================
// SIDEBAR
// =====================================================

function Sidebar({
  items,
  active,
  setPage,
}) {
  return (
    <aside className="sidebar">
      {items.map(item => (
        <button
          key={item.value}
          className={
            active === item.value
              ? 'side-item active'
              : 'side-item'
          }
          onClick={() =>
            setPage(item.value)
          }
        >
          {item.value === 'dashboard' &&
            '📊 '}

          {item.value === 'users' &&
            '👥 '}

          {item.value === 'stores' &&
            '🏪 '}

          {item.value === 'password' &&
            '🔐 '}

          {item.label}
        </button>
      ))}
    </aside>
  )
}

// =====================================================
// STAT
// =====================================================

function Stat({
  title,
  value,
  icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  )
}

export default App