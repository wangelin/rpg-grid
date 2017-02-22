export default class Entity {
  constructor ({ name, portrait, hp, speed, size, damage = 0, x, y }) {
    this.name = name
    this.portrait = portrait
    this.hp = hp
    this.speed = speed
    this.size = size
    this.damage = damage
    this.x = x
    this.y = y
  }
}
