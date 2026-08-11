import defaultUser from "../assets/default_user.jpg";
import defaultGroup from "../assets/deafult_group.png";

export function getAvatarSrc(avatar, isGroup = false) {
  if (avatar) return avatar;
  return isGroup ? defaultGroup : defaultUser;
}
