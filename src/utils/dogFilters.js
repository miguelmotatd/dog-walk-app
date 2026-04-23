export function filterDogs(dogs, filters) {
  const { searchText, size, ageRange } = filters

  return dogs.filter((dog) => {
    const matchesName =
      !searchText ||
      dog.name?.toLowerCase().includes(searchText.toLowerCase())

    const matchesSize =
      !size || size === 'all' || dog.size?.toLowerCase() === size.toLowerCase()

    const matchesAge =
      !ageRange || ageRange === 'all'
        ? true
        : matchesAgeRange(dog.age_text, ageRange)

    return matchesName && matchesSize && matchesAge
  })
}

function matchesAgeRange(ageText, ageRange) {
  const ageInYears = parseAgeTextToYears(ageText)

  if (ageInYears == null) return false

  if (ageRange === 'under_1') return ageInYears < 1
  if (ageRange === '1_3') return ageInYears >= 1 && ageInYears <= 3
  if (ageRange === '4_7') return ageInYears >= 4 && ageInYears <= 7
  if (ageRange === '8_plus') return ageInYears >= 8

  return true
}

function parseAgeTextToYears(ageText) {
  if (!ageText) return null

  const text = ageText.toLowerCase().trim()

  const numberMatch = text.match(/(\d+([.,]\d+)?)/)
  if (!numberMatch) return null

  const value = Number(numberMatch[1].replace(',', '.'))
  if (Number.isNaN(value)) return null

  if (text.includes('month')) return value / 12
  if (text.includes('months')) return value / 12
  if (text.includes('mes')) return value / 12
  if (text.includes('meses')) return value / 12

  return value
}