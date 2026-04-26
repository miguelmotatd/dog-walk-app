export function filterDogs(dogs, filters) {
  const { searchText, size, sex, ageRange } = filters

  return dogs.filter((dog) => {
    const matchesName =
      !searchText ||
      dog.name?.toLowerCase().includes(searchText.toLowerCase())

    const matchesSize =
      !size || size === 'all' || dog.size?.toLowerCase() === size.toLowerCase()

    const matchesSex =
      !sex || sex === 'all' || dog.sex === sex

    const matchesAge =
      !ageRange || ageRange === 'all'
        ? true
        : matchesAgeRange(dog.age, ageRange)

    return matchesName && matchesSize && matchesSex && matchesAge
  })
}

function matchesAgeRange(age, ageRange) {
  if (age == null) return false

  if (ageRange === 'under_1') return age < 1
  if (ageRange === '1_3') return age >= 1 && age <= 3
  if (ageRange === '4_7') return age >= 4 && age <= 7
  if (ageRange === '8_plus') return age >= 8

  return true
}