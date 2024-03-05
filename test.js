// Student 类
// 用来保存学生信息
class Student {
    // 拥有 3 个属性, 分别为 name, age, gender
    // 构造方法会初始化这些属性
    constructor(name, age, gender) {
        this.name = name
        this.age = age
        this.gender = gender
    }

    // 通过一个 json 格式的字符串来初始化一个 Student 对象
    newFromJSON(json) {
        let s = JSON.parse(json)
        let name = s['name']
        let age = s['age']
        let gender = s['gender']
        // 如果 json 格式不正确, 返回 null
        if (name === undefined)

        return new Student(name, age, gender)
    }

    
    // 返回学生的描述信息
    description() {
        let s = `name: ${this.name}, age: ${this.age}`
        return s
    }
}

const __main = function() {
    
}


__main()