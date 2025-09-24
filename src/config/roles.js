const allRoles = {
  user: [],
  admin: ["isVerified"],
};

const role = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  role,
  roleRights,
};
