import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../features/profile/profileApi";
import { StatusChip } from "../shared/ui/StatusChip";

export function ProfilePage() {
  const profileQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser
  });

  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">Profile</h1>
        {profileQuery.isLoading && <p className="page-subtitle">Loading profile</p>}
        {profileQuery.isError && (
          <div className="form-error">{profileQuery.error.message || "Could not load profile"}</div>
        )}
        {profileQuery.data && (
          <div className="profile-grid">
            <div>
              <p className="eyebrow">Full name</p>
              <strong>{profileQuery.data.fullName}</strong>
            </div>
            <div>
              <p className="eyebrow">Email</p>
              <span>{profileQuery.data.email}</span>
            </div>
            <div>
              <p className="eyebrow">Phone</p>
              <span>{profileQuery.data.phone}</span>
            </div>
            <div>
              <p className="eyebrow">Roles</p>
              <div className="role-list">
                {profileQuery.data.roles.map((role) => (
                  <StatusChip key={role} status={role === "PASSENGER" ? "CONFIRMED" : "SCHEDULED"} label={role} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
