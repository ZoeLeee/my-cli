function before(target, name, descriptor){
  console.log(target);
  console.log(name);
  console.log(descriptor);
}

function d(tar){
  console.log(tar);
}

// @before
@d
class Test{
  @before
  b(){
    console.log(123);
  }
}

let t=new Test();