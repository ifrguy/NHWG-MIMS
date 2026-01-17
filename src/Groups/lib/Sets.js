// These function extend the Mongosh Set object with missing set operations.
// Mongosh is clearly not up to date with the latest JavaScript MDN standard.
//
// History:
// 10Jan26 MEG Created.

// These are naive set operations. I don't consider sets that contain
// sets or sets that are members of themselves!

// Methods are given the same names as in the Mozilla JavaSrcipt standard.
// difference
// intersection
// isDisjointFrom
// isSubsetOf
// isSupersetOf
// symmetricDifference
// union

// Difference 'this' - 'other'
// Returns a new set containing all the items in 'this' set but not in 'other'.
Set.prototype.difference = function( other ) {
    let result = new Set();
    this.forEach( (k) => { other.has( k ) ? null : result.add( k ); } );
    return result;
}

// Intersection A∩B={x∊A∣x∊B}
// Returns a new set containing intersection of 'this' set and the 'other' set,
// i.e. all the elements that appear are in both sets.
Set.prototype.intersection = function( other ) {
    let result = new Set();
    this.forEach( (k) => { other.has( k ) ? result.add( k ) : null; } );
    return result;
}

// Is disjoint from: A is disjoint from B <=> A ∩ B = ∅
// Returns true if 'this' & 'other' have no items in common.
Set.prototype.isDisjointFrom = function( other ) {
    // Set source and target sets
    let s = this;  // source set
    let t = other; // target set
    // The source must be the longest set so we potentially check all members.
    if ( this.size < other.size ) {
	// swap source and target, we evaluate the longest as the source
	// to assure that ALL elements are considered.
	s = other;
	t = this;
    }
    // walk the source set 's' against the target set 't'.  If any item
    // is common return false.
    for ( k of s.keys() ) {
	if ( t.has( k ) ) {
	    return false;
	}
    }
    return true;
}

// Is subset A⊆B<=>∀x∊A,x∊B
// Returns true if all of the items in 'this' set are also in the 'other' set.
Set.prototype.isSubsetOf = function( other ) {
    if ( this.size > other.size ) { return false; }
    // iterate over this until we get to the end or hit a false
    for ( k of this.keys() ) {
	if ( !other.has( k ) ) {
	    return false;
	};
    }
    return true;
}

// is A super set of B: A⊇B<=>∀x∊B,x∊A
// Returns true if all of the items in 'other' are also in 'this'
Set.prototype.isSupersetOf = function( other ) {
    if ( this.size < other.size ) { return false; }
    // iterate over this until we get to the end or hit a false
    for ( k of other.keys() ) {
	if ( !this.has( k ) ) {
	    return false;
	};
    }
    return true;
}


// symmetric difference: AΔB=>(A-B)∪(B-A)
// Returns a new set containing items in 'this' | 'other' but not in both.
Set.prototype.symmetricDifference = function( other ) {
    let result = new Set(this);
    // walk the other set, remove any item found in both sets,
    // add any item not found in other (A-B)∪(B-A)
    other.forEach( (k) => {
	( result.has( k ) ) ? result.delete( k ) : result.add( k );
    }
		 );
    return result;
}

// Union: A∪B={x∣x∊A or x∊B}
// Returns the union of 'this' and 'other', items in either or both sets
Set.prototype.union = function( other ) {
    let result = new Set( this );
    other.forEach( (k) => {
	( ! result.has( k ) ) ? result.add( k ) : null;
    } );
    return result;
}
