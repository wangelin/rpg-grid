export default class Entity {
  constructor ({ name, hp, speed, size, damage = 0, x, y }) {
    this.name = name
    this.hp = hp
    this.speed = speed
    this.size = size
    this.damage = damage
    this.x = x
    this.y = y
  }
}
