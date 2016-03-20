// e.g. join array with ", " but last element ", and " or ", or "
export function joinArrayWithDifferentLastJoiner(array, join, lastJoin) {
  return array.slice(0, -1).join(join) + lastJoin + array.slice(-1);
}
